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
define (
    ['./RemsTelemetrySeries'],
    function (RemsTelemetrySeries) {
        "use strict";

        var SOURCE = "rems.source";

        function RemsTelemetryProvider(adapter, $q) {
            this.adapter = adapter;
            this.$q = $q;
        }

        /**
         * Retrieve telemetry from this telemetry source.
         * @memberOf example/msl
         * @param {Array<TelemetryRequest>} requests An array of all request
         * objects (which needs to be filtered to only those relevant to this
         * source)
         * @returns {Promise} A {@link Promise} resolved with a {@link RemsTelemetrySeries}
         * object that wraps the telemetry returned from the telemetry source.
         */
        RemsTelemetryProvider.prototype.requestTelemetry = function (requests) {
            var packaged = {},
                relevantReqs,
                adapter = this.adapter;

            function matchesSource(request) {
                return (request.source === SOURCE);
            }

            function addToPackage(history) {
                packaged[SOURCE][history.id] =
                    new RemsTelemetrySeries(history.values);
            }

            function handleRequest(request) {
                return adapter.history(request).then(addToPackage);
            }

            relevantReqs = requests.filter(matchesSource);
            packaged[SOURCE] = {};

            return this.$q.all(relevantReqs.map(handleRequest))
                .then(function () {
                    return packaged;
                });
        };

        /**
         * This data source does not support real-time subscriptions
         */
        RemsTelemetryProvider.prototype.subscribe = function (callback, requests) {
            return function () {};
        };

        RemsTelemetryProvider.prototype.unsubscribe = function (callback, requests) {
            return function () {};
        };

        return RemsTelemetryProvider;
    }
);
