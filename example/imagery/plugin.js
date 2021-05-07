/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([

], function (

) {
    function ImageryPlugin() {

        const IMAGE_SAMPLES = [
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18731.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18732.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18733.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18734.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18735.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18736.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18737.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18738.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18739.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18740.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18741.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18742.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18743.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18744.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18745.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18746.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18747.jpg",
            "https://www.hq.nasa.gov/alsj/a16/AS16-117-18748.jpg"
        ];
        const IMAGE_DELAY = 20000;

        function pointForTimestamp(timestamp, name) {
            const url = IMAGE_SAMPLES[Math.floor(timestamp / IMAGE_DELAY) % IMAGE_SAMPLES.length];
            const urlItems = url.split('/');
            const imageDownloadName = `example.imagery.${urlItems[urlItems.length - 1]}`;

            return {
                name,
                utc: Math.floor(timestamp / IMAGE_DELAY) * IMAGE_DELAY,
                local: Math.floor(timestamp / IMAGE_DELAY) * IMAGE_DELAY,
                url,
                imageDownloadName
            };
        }

        var realtimeProvider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === 'example.imagery';
            },
            subscribe: function (domainObject, callback) {
                var interval = setInterval(function () {
                    callback(pointForTimestamp(Date.now(), domainObject.name));
                }, IMAGE_DELAY);

                return function () {
                    clearInterval(interval);
                };
            }
        };

        var historicalProvider = {
            supportsRequest: function (domainObject, options) {
                return domainObject.type === 'example.imagery'
                    && options.strategy !== 'latest';
            },
            request: function (domainObject, options) {
                var start = options.start;
                var end = Math.min(options.end, Date.now());
                var data = [];
                while (start <= end && data.length < IMAGE_DELAY) {
                    data.push(pointForTimestamp(start, domainObject.name));
                    start += IMAGE_DELAY;
                }

                return Promise.resolve(data);
            }
        };

        var ladProvider = {
            supportsRequest: function (domainObject, options) {
                return domainObject.type === 'example.imagery'
                    && options.strategy === 'latest';
            },
            request: function (domainObject, options) {
                return Promise.resolve([pointForTimestamp(Date.now(), domainObject.name)]);
            }
        };

        return function install(openmct) {
            openmct.types.addType('example.imagery', {
                key: 'example.imagery',
                name: 'Example Imagery',
                cssClass: 'icon-image',
                description: 'For development use. Creates example imagery '
                    + 'data that mimics a live imagery stream.',
                creatable: true,
                initialize: function (object) {
                    object.telemetry = {
                        values: [
                            {
                                name: 'Name',
                                key: 'name'
                            },
                            {
                                name: 'Time',
                                key: 'utc',
                                format: 'utc',
                                hints: {
                                    domain: 2
                                }
                            },
                            {
                                name: 'Local Time',
                                key: 'local',
                                format: 'local-format',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Image',
                                key: 'url',
                                format: 'image',
                                hints: {
                                    image: 1
                                }
                            },
                            {
                                name: 'Image Download Name',
                                key: 'imageDownloadName',
                                format: 'imageDownloadName',
                                hints: {
                                    imageDownloadName: 1
                                }
                            }
                        ]
                    };
                }
            });

            openmct.telemetry.addProvider(realtimeProvider);
            openmct.telemetry.addProvider(historicalProvider);
            openmct.telemetry.addProvider(ladProvider);
        };
    }

    return ImageryPlugin;
});
