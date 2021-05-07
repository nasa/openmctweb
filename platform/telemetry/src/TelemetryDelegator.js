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

define(
    [],
    function () {

        /**
         * Used to handle telemetry delegation associated with a
         * given domain object.
         * @constructor
         * @memberof platform/telemetry
         */
        function TelemetryDelegator($q) {
            this.$q = $q;
        }

        /**
         * Promise telemetry-providing objects associated with
         * this domain object (either the domain object itself,
         * or the objects it delegates)
         * @param {DomainObject} the domain object which may have
         *        or delegate telemetry
         * @returns {Promise.<DomainObject[]>} domain objects with
         *          a telemetry capability
         */
        TelemetryDelegator.prototype.promiseTelemetryObjects = function (domainObject) {
            var $q = this.$q;

            // If object has been cleared, there are no relevant
            // telemetry-providing domain objects.
            if (!domainObject) {
                return $q.when([]);
            }

            // Otherwise, try delegation first, and attach the
            // object itself if it has a telemetry capability.
            return $q.when(domainObject.useCapability(
                "delegation",
                "telemetry"
            )).then(function (result) {
                var head = domainObject.hasCapability("telemetry")
                        ? [domainObject] : [],
                    tail = result || [];

                return head.concat(tail);
            });
        };

        return TelemetryDelegator;
    }
);
