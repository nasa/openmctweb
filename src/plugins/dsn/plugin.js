
define([
    './res/dsn-dictionary.json',
    './DsnUtils',
    './DsnParser'
], function (
    baseDictionary,
    DsnUtils,
    DsnParser
) {

    var compositionProvider,
        config,
        dictionary,
        listeners = {},
        objectProvider,
        realTimeProvider;

    var DSN_CONFIG_SOURCE = 'https://eyes.nasa.gov/dsn/config.xml',
        DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network',
        DSN_TELEMETRY_SOURCE = 'https://eyes.nasa.gov/dsn/data/dsn.xml',
        DSN_TELEMETRY_TYPE = 'dsn.telemetry';

    function checkFetchStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response);
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    }

    function getDsnConfiguration() {
        var url = '/proxyUrl?url=' + encodeURIComponent(DSN_CONFIG_SOURCE);

        return fetch(url)
            .then(checkFetchStatus)
            .then(response => response.text())
            .then(data => {
                var domParser = new DOMParser(),
                    dsn,
                    parser = new DsnParser(),
                    xml;

                xml = domParser.parseFromString(data, 'application/xml');
                dsn = parser.parseXml(xml);
                config = dsn.data;
            })
            .catch(error => console.error('Error fetching DSN config: ', error));
    }

    function getDsnData(domainObject) {
        // Add the same query string parameter the DSN site sends with each request
        var url = '/proxyUrl?url=' + encodeURIComponent(DSN_TELEMETRY_SOURCE + '?r=' + Math.floor(new Date().getTime() / 5000));

        return fetch(url)
            .then(checkFetchStatus)
            .then(response => response.text())
            .then(data => {
                var domParser = new DOMParser(),
                    dsn,
                    dsnData = '',
                    parser = new DsnParser(config),
                    xml;

                xml = domParser.parseFromString(data, 'application/xml');
                dsn = parser.parseXml(xml);

                if (dsn.data.hasOwnProperty(domainObject.identifier.key)) {
                    if (typeof dsn.data[domainObject.identifier.key] === 'object') {
                        dsnData = dsn.data[domainObject.identifier.key];
                    } else {
                        dsnData = {};
                        dsnData[domainObject.identifier.key] = dsn.data[domainObject.identifier.key];
                    }
                }

                return dsnData;
            })
            .catch(error => console.error('Error fetching DSN data: ', error));
    }

    objectProvider = {
        get: function (identifier) {
            if (identifier.key === 'dsn') {
                return Promise.resolve({
                    identifier: {
                        namespace: 'deep.space.network',
                        key: 'dsn'
                    },
                    type: 'folder',
                    location: 'ROOT',
                    name: 'Deep Space Network',
                    composition: []
                });
            } else {
                return Promise.resolve(
                    dictionary.domainObjects[DsnUtils.serializeIdentifier(identifier)]
                );
            }
        }
    };

    compositionProvider = {
        appliesTo: function (domainObject) {
            return domainObject.identifier.namespace === DSN_NAMESPACE && domainObject.composition !== undefined;
        },
        load: function (domainObject) {
            if (domainObject.identifier.key === DSN_KEY) {
                return Promise.resolve(Object.keys(dictionary.domainObjects).filter(function (key) {
                    return dictionary.domainObjects[key].location === DSN_NAMESPACE + ':' + DSN_KEY;
                }).map(function (key) {
                    var childId = DsnUtils.deserializeIdentifier(key);
                    return {
                        namespace: childId.namespace,
                        key: childId.key
                    };
                }));
            } else {
                return Promise.resolve(
                    dictionary.domainObjects[DsnUtils.serializeIdentifier(domainObject.identifier)].composition.map(function (key) {
                        var childId = DsnUtils.deserializeIdentifier(key);
                        return {
                            namespace: childId.namespace,
                            key: childId.key
                        };
                    })
                );
            }
        }
    };

    realTimeProvider = {
        supportsSubscribe: function (domainObject) {
            return domainObject.type === DSN_TELEMETRY_TYPE || domainObject.type === 'table';
        },
        subscribe: function (domainObject, callback, options) {
            // Keep track of the domain objects subscribed
            if (!listeners[domainObject.identifier.key]) {
                listeners[domainObject.identifier.key] = [];
            }

            listeners[domainObject.identifier.key].push(callback);

            // DSN data is updated every 5 seconds
            var interval = setInterval(function () {
                getDsnData(domainObject).then(function (datum) {
                    // Invoke the callback with the updated datum
                    if (Array.isArray(datum)) {
                        datum.forEach(function (value) {
                            callback(value);
                        });
                    } else {
                        callback(datum);
                    }
                });
            }, 5000);

            return function () {
                // Stop polling the DSN site
                clearInterval(interval);

                // Unsubscribe domain object
                listeners[domainObject.identifier.key] =
                        listeners[domainObject.identifier.key].filter(function (c) {
                            return c !== callback;
                        });
            };
        }
    };

    function DsnPlugin() {
        return function install(openmct) {
            openmct.objects.addRoot({
                namespace: DSN_NAMESPACE,
                key: DSN_KEY
            });

            // Original formatter calculations: https://eyes.nasa.gov/dsn/javascripts/main.js

            // Antenna formatters
            openmct.telemetry.addFormat({
                key: 'angle-to-string',
                format: function (angle) {
                    // Assumes angle is in degrees
                    return typeof angle === 'number' ? angle.toFixed(2) + ' deg' : angle;
                },
                parse: function (angle) {
                    return typeof angle === 'string' ? parseFloat(angle) : angle;
                },
                validate: function (angle) {
                    return !isNaN(parseFloat(angle));
                }
            });

            openmct.telemetry.addFormat({
                key: 'wind-speed-to-string',
                format: function (windSpeed) {
                    // Assumes wind speed is in km/hr
                    return typeof windSpeed === 'number' ? windSpeed.toFixed(2) + ' km/hr' : windSpeed;
                },
                parse: function (windSpeed) {
                    return typeof windSpeed === 'string' ? parseFloat(windSpeed) : windSpeed;
                },
                validate: function (windSpeed) {
                    return !isNaN(parseFloat(windSpeed));
                }
            });

            // Signal formatters
            openmct.telemetry.addFormat({
                key: 'data-rate-to-string',
                format: function (dataRate) {
                    // Assumes data rate is in b/sec
                    if (typeof dataRate === 'number') {
                        if (dataRate < 1000) {
                            return dataRate.toFixed(2) + ' b/sec';
                        } else if (dataRate < 1000000) {
                            return (dataRate / 1000).toFixed(2) + ' kb/sec';
                        } else if (dataRate < 1000000000) {
                            return (dataRate / 1000000).toFixed(2) + ' Mb/sec';
                        } else if (dataRate < 1000000000000) {
                            return (dataRate / 1000000000).toFixed(2) + ' Gb/sec';
                        } else if (dataRate < 1000000000000000) {
                            return (dataRate / 1000000000000).toFixed(2) + ' Tb/sec';
                        } else {
                            return (dataRate / 1000000000000000).toFixed(2) + ' Pb/sec';
                        }
                    } else {
                        return dataRate;
                    }
                },
                parse: function (dataRate) {
                    return typeof dataRate === 'string' ? parseFloat(dataRate) : dataRate;
                },
                validate: function (dataRate) {
                    return !isNaN(parseFloat(dataRate));
                }
            });

            openmct.telemetry.addFormat({
                key: 'frequency-to-string',
                format: function (frequency) {
                    // Assumes frequency is in Hz
                    if (typeof frequency === 'number') {
                        if (frequency < 1000) {
                            return frequency.toFixed(2) + ' Hz';
                        } else if (frequency < 1000000) {
                            return (frequency / 1000).toFixed(2) + ' kHz';
                        } else if (frequency < 1000000000) {
                            return (frequency / 1000000).toFixed(2) + ' MHz';
                        } else if (frequency < 1000000000000) {
                            return (frequency / 1000000000).toFixed(2) + ' GHz';
                        } else {
                            return (frequency / 1000000000000) + ' THz';
                        }
                    } else {
                        return frequency;
                    }
                },
                parse: function (frequency) {
                    return typeof frequency === 'string' ? parseFloat(frequency) : frequency;
                },
                validate: function (frequency) {
                    return !isNaN(parseFloat(frequency));
                }
            });

            openmct.telemetry.addFormat({
                key: 'power-to-string',
                format: function (power) {
                    // Assumes power is in kW or dBm (if negative)
                    if (typeof power === 'number') {
                        if (power >= 0) {
                            return power.toFixed(2) + ' kW';
                        } else {
                            return power.toFixed(2) + ' dBm';
                        }
                    } else {
                        return power;
                    }
                },
                parse: function (power) {
                    return typeof power === 'string' ? parseFloat(power) : power;
                },
                validate: function (power) {
                    return !isNaN(parseFloat(power));
                }
            });

            // Target formatters
            openmct.telemetry.addFormat({
                key: 'range-to-string',
                format: function (distance) {
                    // Assumes distance is in km
                    if (typeof distance === 'number') {
                        if (distance >= 0) {
                            if (distance < 1000) {
                                return distance.toFixed(2) + ' km';
                            } else if (distance < 1000000) {
                                return (distance / 1000).toFixed(2) + ' thousand km';
                            } else if (distance < 1000000000) {
                                return (distance / 1000000).toFixed(2) + ' million km';
                            } else if (distance < 1000000000000) {
                                return (distance / 1000000000).toFixed(2) + ' billion km';
                            } else if (distance < 1000000000000000) {
                                return (distance / 1000000000000).toFixed(2) + ' trillion km';
                            } else {
                                return (distance / 1000000000000000).toFixed(2) + ' quadrillion km';
                            }
                        } else {
                            return distance;
                        }
                    } else {
                        return distance;
                    }
                },
                parse: function (distance) {
                    return typeof distance === 'string' ? parseFloat(distance) : distance;
                },
                validate: function (distance) {
                    return !isNaN(parseFloat(distance));
                }
            });

            openmct.telemetry.addFormat({
                key: 'light-time-to-string',
                format: function (lightTime) {
                    // Assumes light time is in seconds
                    if (typeof lightTime === 'number') {
                        if (lightTime >= 0) {
                            if (lightTime < 60) {
                                return lightTime.toFixed(2) + ' sec';
                            } else if (lightTime < 3600) {
                                return (lightTime / 60).toFixed(2) + ' minutes';
                            } else if (lightTime < 86400) {
                                return (lightTime / 3600).toFixed(2) + ' hours';
                            } else if (lightTime < 604800) {
                                return (lightTime / 86400).toFixed(2) + ' days';
                            } else {
                                return (lightTime / 604800).toFixed(2) + ' weeks';
                            }
                        } else {
                            return lightTime;
                        }
                    } else {
                        return lightTime;
                    }
                },
                parse: function (lightTime) {
                    return typeof lightTime === 'string' ? parseFloat(lightTime) : lightTime;
                },
                validate: function (lightTime) {
                    return !isNaN(parseFloat(lightTime));
                }
            });

            dictionary = baseDictionary;

            getDsnConfiguration();

            openmct.objects.addProvider(DSN_NAMESPACE, objectProvider);
            openmct.composition.addProvider(compositionProvider);
            openmct.telemetry.addProvider(realTimeProvider);

            // This type represents DSN domain objects with telemetry
            openmct.types.addType(DSN_TELEMETRY_TYPE, {
                name: 'DSNTelemetry',
                description: 'A DSN domain object with telemetry.',
                cssClass: 'icon-telemetry'
            });
        };
    }

    return DsnPlugin;
});
