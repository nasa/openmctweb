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

/**
 * Module defining EventTelemetryProvider. Created by chacskaylo on 06/18/2015.
 */
define(
    ["./EventTelemetry"],
    function (EventTelemetry) {
        "use strict";

        /**
         *
         * @constructor
         */
        function EventTelemetryProvider($q, $timeout) {
            var subscriptions = [],
                genInterval = 1000,
                generating = false;

            //
            function matchesSource(request) {
                return request.source === "eventGenerator";
            }

            // Used internally; this will be repacked by doPackage
            function generateData(request) {
                return {
                    key: request.key,
                    telemetry: new EventTelemetry(request, genInterval)
                };
            }

            //
            function doPackage(results) {
                var packaged = {};
                results.forEach(function (result) {
                    packaged[result.key] = result.telemetry;
                });

                // Format as expected (sources -> keys -> telemetry)
                return { eventGenerator: packaged };
            }

            function requestTelemetry(requests) {
                return $timeout(function () {
                    return doPackage(requests.filter(matchesSource).map(generateData));
                }, 0);
            }

            function handleSubscriptions(timeout) {
                subscriptions.forEach(function (subscription) {
                    var requests = subscription.requests;
                    subscription.callback(doPackage(
                        requests.filter(matchesSource).map(generateData)
                    ));
                });
            }

            function startGenerating() {
                generating = true;
                $timeout(function () {
                    handleSubscriptions();
                    if (generating && subscriptions.length > 0) {
                        startGenerating();
                    } else {
                        generating = false;
                    }
                }, genInterval);
            }

            function subscribe(callback, requests) {
                var subscription = {
                    callback: callback,
                    requests: requests
                };
                function unsubscribe() {
                    subscriptions = subscriptions.filter(function (s) {
                        return s !== subscription;
                    });
                }

                subscriptions.push(subscription);
                if (!generating) {
                    startGenerating();
                }

                return unsubscribe;
            }

            return {
                requestTelemetry: requestTelemetry,
                subscribe: subscribe
            };
        }

        return EventTelemetryProvider;
    }
);
