/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    '../../plugins/displayLayout/CustomStringFormatter',
    './TelemetryMetadataManager',
    './TelemetryValueFormatter',
    './DefaultMetadataProvider',
    'objectUtils',
    'lodash'
], function (
    CustomStringFormatter,
    TelemetryMetadataManager,
    TelemetryValueFormatter,
    DefaultMetadataProvider,
    objectUtils,
    _
) {
    /**
     * A LimitEvaluator may be used to detect when telemetry values
     * have exceeded nominal conditions.
     *
     * @interface LimitEvaluator
     * @memberof module:openmct.TelemetryAPI~
     */

    /**
     * Check for any limit violations associated with a telemetry datum.
     * @method evaluate
     * @param {*} datum the telemetry datum to evaluate
     * @param {TelemetryProperty} the property to check for limit violations
     * @memberof module:openmct.TelemetryAPI~LimitEvaluator
     * @returns {module:openmct.TelemetryAPI~LimitViolation} metadata about
     *          the limit violation, or undefined if a value is within limits
     */

    /**
     * A violation of limits defined for a telemetry property.
     * @typedef LimitViolation
     * @memberof {module:openmct.TelemetryAPI~}
     * @property {string} cssClass the class (or space-separated classes) to
     *           apply to display elements for values which violate this limit
     * @property {string} name the human-readable name for the limit violation
     */

    /**
     * A TelemetryFormatter converts telemetry values for purposes of
     * display as text.
     *
     * @interface TelemetryFormatter
     * @memberof module:openmct.TelemetryAPI~
     */

    /**
     * Retrieve the 'key' from the datum and format it accordingly to
     * telemetry metadata in domain object.
     *
     * @method format
     * @memberof module:openmct.TelemetryAPI~TelemetryFormatter#
     */

    /**
     * Describes a property which would be found in a datum of telemetry
     * associated with a particular domain object.
     *
     * @typedef TelemetryProperty
     * @memberof module:openmct.TelemetryAPI~
     * @property {string} key the name of the property in the datum which
     *           contains this telemetry value
     * @property {string} name the human-readable name for this property
     * @property {string} [units] the units associated with this property
     * @property {boolean} [temporal] true if this property is a timestamp, or
     *           may be otherwise used to order telemetry in a time-like
     *           fashion; default is false
     * @property {boolean} [numeric] true if the values for this property
     *           can be interpreted plainly as numbers; default is true
     * @property {boolean} [enumerated] true if this property may have only
     *           certain specific values; default is false
     * @property {string} [values] for enumerated states, an ordered list
     *           of possible values
     */

    /**
     * Describes and bounds requests for telemetry data.
     *
     * @typedef TelemetryRequest
     * @memberof module:openmct.TelemetryAPI~
     * @property {string} sort the key of the property to sort by. This may
     *           be prefixed with a "+" or a "-" sign to sort in ascending
     *           or descending order respectively. If no prefix is present,
     *           ascending order will be used.
     * @property {*} start the lower bound for values of the sorting property
     * @property {*} end the upper bound for values of the sorting property
     * @property {string[]} strategies symbolic identifiers for strategies
     *           (such as `minmax`) which may be recognized by providers;
     *           these will be tried in order until an appropriate provider
     *           is found
     */

    /**
     * Provides telemetry data. To connect to new data sources, new
     * TelemetryProvider implementations should be
     * [registered]{@link module:openmct.TelemetryAPI#addProvider}.
     *
     * @interface TelemetryProvider
     * @memberof module:openmct.TelemetryAPI~
     */

    /**
     * An interface for retrieving telemetry data associated with a domain
     * object.
     *
     * @interface TelemetryAPI
     * @augments module:openmct.TelemetryAPI~TelemetryProvider
     * @memberof module:openmct
     */
    function TelemetryAPI(openmct) {
        this.openmct = openmct;
        this.requestProviders = [];
        this.subscriptionProviders = [];
        this.metadataProviders = [new DefaultMetadataProvider(this.openmct)];
        this.limitProviders = [];
        this.metadataCache = new WeakMap();
        this.formatMapCache = new WeakMap();
        this.valueFormatterCache = new WeakMap();
    }

    /**
     * Return Custom String Formatter
     *
     * @param {Object} valueMetadata valueMetadata for given telemetry object
     * @param {string} format custom formatter string (eg: %.4f, &lts etc.)
     * @returns {CustomStringFormatter}
     */
    TelemetryAPI.prototype.customStringFormatter = function (valueMetadata, format) {
        return new CustomStringFormatter.default(this.openmct, valueMetadata, format);
    };

    /**
     * Return true if the given domainObject is a telemetry object.  A telemetry
     * object is any object which has telemetry metadata-- regardless of whether
     * the telemetry object has an available telemetry provider.
     *
     * @param {module:openmct.DomainObject} domainObject
     * @returns {boolean} true if the object is a telemetry object.
     */
    TelemetryAPI.prototype.isTelemetryObject = function (domainObject) {
        return Boolean(this.findMetadataProvider(domainObject));
    };

    /**
     * Check if this provider can supply telemetry data associated with
     * this domain object.
     *
     * @method canProvideTelemetry
     * @param {module:openmct.DomainObject} domainObject the object for
     *        which telemetry would be provided
     * @returns {boolean} true if telemetry can be provided
     * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
     */
    TelemetryAPI.prototype.canProvideTelemetry = function (domainObject) {
        console.warn(
            'DEPRECATION WARNING: openmct.telemetry.canProvideTelemetry '
            + 'will not be supported in future versions of Open MCT.  Please '
            + 'use openmct.telemetry.isTelemetryObject instead.'
        );

        return Boolean(this.findSubscriptionProvider(domainObject))
               || Boolean(this.findRequestProvider(domainObject));
    };

    /**
     * Register a telemetry provider with the telemetry service. This
     * allows you to connect alternative telemetry sources.
     * @method addProvider
     * @memberof module:openmct.TelemetryAPI#
     * @param {module:openmct.TelemetryAPI~TelemetryProvider} provider the new
     *        telemetry provider
     */
    TelemetryAPI.prototype.addProvider = function (provider) {
        if (provider.supportsRequest) {
            this.requestProviders.unshift(provider);
        }

        if (provider.supportsSubscribe) {
            this.subscriptionProviders.unshift(provider);
        }

        if (provider.supportsMetadata) {
            this.metadataProviders.unshift(provider);
        }

        if (provider.supportsLimits) {
            this.limitProviders.unshift(provider);
        }
    };

    /**
     * @private
     */
    TelemetryAPI.prototype.findSubscriptionProvider = function () {
        const args = Array.prototype.slice.apply(arguments);
        function supportsDomainObject(provider) {
            return provider.supportsSubscribe.apply(provider, args);
        }

        return this.subscriptionProviders.filter(supportsDomainObject)[0];
    };

    /**
     * @private
     */
    TelemetryAPI.prototype.findRequestProvider = function (domainObject) {
        const args = Array.prototype.slice.apply(arguments);
        function supportsDomainObject(provider) {
            return provider.supportsRequest.apply(provider, args);
        }

        return this.requestProviders.filter(supportsDomainObject)[0];
    };

    /**
     * @private
     */
    TelemetryAPI.prototype.findMetadataProvider = function (domainObject) {
        return this.metadataProviders.filter(function (p) {
            return p.supportsMetadata(domainObject);
        })[0];
    };

    /**
     * @private
     */
    TelemetryAPI.prototype.findLimitEvaluator = function (domainObject) {
        return this.limitProviders.filter(function (p) {
            return p.supportsLimits(domainObject);
        })[0];
    };

    /**
     * @private
     */
    TelemetryAPI.prototype.standardizeRequestOptions = function (options) {
        if (!Object.prototype.hasOwnProperty.call(options, 'start')) {
            options.start = this.openmct.time.bounds().start;
        }

        if (!Object.prototype.hasOwnProperty.call(options, 'end')) {
            options.end = this.openmct.time.bounds().end;
        }

        if (!Object.prototype.hasOwnProperty.call(options, 'domain')) {
            options.domain = this.openmct.time.timeSystem().key;
        }
    };

    /**
     * Request historical telemetry for a domain object.
     * The `options` argument allows you to specify filters
     * (start, end, etc.), sort order, and strategies for retrieving
     * telemetry (aggregation, latest available, etc.).
     *
     * @method request
     * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
     * @param {module:openmct.DomainObject} domainObject the object
     *        which has associated telemetry
     * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
     *        options for this historical request
     * @returns {Promise.<object[]>} a promise for an array of
     *          telemetry data
     */
    TelemetryAPI.prototype.request = function (domainObject) {
        if (arguments.length === 1) {
            arguments.length = 2;
            arguments[1] = {};
        }

        this.standardizeRequestOptions(arguments[1]);
        const provider = this.findRequestProvider.apply(this, arguments);
        if (!provider) {
            return Promise.reject('No provider found');
        }

        return provider.request.apply(provider, arguments).catch((rejected) => {
            this.openmct.notifications.error('Error requesting telemetry data, see console for details');
            console.error(rejected);

            return Promise.reject(rejected);
        });
    };

    /**
     * Subscribe to realtime telemetry for a specific domain object.
     * The callback will be called whenever data is received from a
     * realtime provider.
     *
     * @method subscribe
     * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
     * @param {module:openmct.DomainObject} domainObject the object
     *        which has associated telemetry
     * @param {Function} callback the callback to invoke with new data, as
     *        it becomes available
     * @returns {Function} a function which may be called to terminate
     *          the subscription
     */
    TelemetryAPI.prototype.subscribe = function (domainObject, callback, options) {
        const provider = this.findSubscriptionProvider(domainObject);

        if (!this.subscribeCache) {
            this.subscribeCache = {};
        }

        const keyString = objectUtils.makeKeyString(domainObject.identifier);
        let subscriber = this.subscribeCache[keyString];

        if (!subscriber) {
            subscriber = this.subscribeCache[keyString] = {
                callbacks: [callback]
            };
            if (provider) {
                subscriber.unsubscribe = provider
                    .subscribe(domainObject, function (value) {
                        subscriber.callbacks.forEach(function (cb) {
                            cb(value);
                        });
                    }, options);
            } else {
                subscriber.unsubscribe = function () {};
            }
        } else {
            subscriber.callbacks.push(callback);
        }

        return function unsubscribe() {
            subscriber.callbacks = subscriber.callbacks.filter(function (cb) {
                return cb !== callback;
            });
            if (subscriber.callbacks.length === 0) {
                subscriber.unsubscribe();
                delete this.subscribeCache[keyString];
            }
        }.bind(this);
    };

    /**
     * Get telemetry metadata for a given domain object.  Returns a telemetry
     * metadata manager which provides methods for interrogating telemetry
     * metadata.
     *
     * @returns {TelemetryMetadataManager}
     */
    TelemetryAPI.prototype.getMetadata = function (domainObject) {
        if (!this.metadataCache.has(domainObject)) {
            const metadataProvider = this.findMetadataProvider(domainObject);
            if (!metadataProvider) {
                return;
            }

            const metadata = metadataProvider.getMetadata(domainObject);

            this.metadataCache.set(
                domainObject,
                new TelemetryMetadataManager(metadata)
            );
        }

        return this.metadataCache.get(domainObject);
    };

    /**
     * Return an array of valueMetadatas that are common to all supplied
     * telemetry objects and match the requested hints.
     *
     */
    TelemetryAPI.prototype.commonValuesForHints = function (metadatas, hints) {
        const options = metadatas.map(function (metadata) {
            const values = metadata.valuesForHints(hints);

            return _.keyBy(values, 'key');
        }).reduce(function (a, b) {
            const results = {};
            Object.keys(a).forEach(function (key) {
                if (Object.prototype.hasOwnProperty.call(b, key)) {
                    results[key] = a[key];
                }
            });

            return results;
        });
        const sortKeys = hints.map(function (h) {
            return 'hints.' + h;
        });

        return _.sortBy(options, sortKeys);
    };

    /**
     * @private
     */
    TelemetryAPI.prototype.getFormatService = function () {
        if (!this.formatService) {
            this.formatService = this.openmct.$injector.get('formatService');
        }

        return this.formatService;
    };

    /**
     * Get a value formatter for a given valueMetadata.
     *
     * @returns {TelemetryValueFormatter}
     */
    TelemetryAPI.prototype.getValueFormatter = function (valueMetadata) {
        if (!this.valueFormatterCache.has(valueMetadata)) {
            this.valueFormatterCache.set(
                valueMetadata,
                new TelemetryValueFormatter(valueMetadata, this.getFormatService())
            );
        }

        return this.valueFormatterCache.get(valueMetadata);
    };

    /**
     * Get a value formatter for a given key.
     * @param {string} key
     *
     * @returns {Format}
     */
    TelemetryAPI.prototype.getFormatter = function (key) {
        const formatMap = this.getFormatService().formatMap;

        return formatMap[key];
    };

    /**
     * Get a format map of all value formatters for a given piece of telemetry
     * metadata.
     *
     * @returns {Object<String, {TelemetryValueFormatter}>}
     */
    TelemetryAPI.prototype.getFormatMap = function (metadata) {
        if (!this.formatMapCache.has(metadata)) {
            const formatMap = metadata.values().reduce(function (map, valueMetadata) {
                map[valueMetadata.key] = this.getValueFormatter(valueMetadata);

                return map;
            }.bind(this), {});
            this.formatMapCache.set(metadata, formatMap);
        }

        return this.formatMapCache.get(metadata);
    };

    /**
     * Register a new telemetry data formatter.
     * @param {Format} format the
     */
    TelemetryAPI.prototype.addFormat = function (format) {
        this.openmct.legacyExtension('formats', {
            key: format.key,
            implementation: function () {
                return format;
            }
        });
    };

    /**
     * Get a limit evaluator for this domain object.
     * Limit Evaluators help you evaluate limit and alarm status of individual
     * telemetry datums for display purposes without having to interact directly
     * with the Limit API.
     *
     * This method is optional.
     * If a provider does not implement this method, it is presumed
     * that no limits are defined for this domain object's telemetry.
     *
     * @param {module:openmct.DomainObject} domainObject the domain
     *        object for which to evaluate limits
     * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
     * @method limitEvaluator
     * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
     */
    TelemetryAPI.prototype.limitEvaluator = function (domainObject) {
        return this.getLimitEvaluator(domainObject);
    };

    /**
     * Get a limit evaluator for this domain object.
     * Limit Evaluators help you evaluate limit and alarm status of individual
     * telemetry datums for display purposes without having to interact directly
     * with the Limit API.
     *
     * This method is optional.
     * If a provider does not implement this method, it is presumed
     * that no limits are defined for this domain object's telemetry.
     *
     * @param {module:openmct.DomainObject} domainObject the domain
     *        object for which to evaluate limits
     * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
     * @method limitEvaluator
     * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
     */
    TelemetryAPI.prototype.getLimitEvaluator = function (domainObject) {
        const provider = this.findLimitEvaluator(domainObject);
        if (!provider) {
            return {
                evaluate: function () {}
            };
        }

        return provider.getLimitEvaluator(domainObject);
    };

    return TelemetryAPI;
});
