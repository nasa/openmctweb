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
    ["./TelemetrySubscription"],
    function (TelemetrySubscription) {

        /**
         * The TelemetrySubscriber is a service which allows
         * subscriptions to be made for new data associated with
         * domain objects. It is exposed as a service named
         * `telemetrySubscriber`.
         *
         * Subscriptions may also be made directly using the
         * `telemetry` capability of a domain object; the subscriber
         * uses this as well, but additionally handles delegation
         * (e.g. for telemetry panels) as well as latest-value
         * extraction.
         *
         * @memberof platform/telemetry
         * @constructor
         * @param $q Angular's $q
         * @param $timeout Angular's $timeout
         */
        function TelemetrySubscriber($q, $timeout) {
            this.$q = $q;
            this.$timeout = $timeout;
        }

        /**
         * Subscribe to streaming telemetry updates
         * associated with this domain object (either
         * directly or via capability delegation.)
         *
         * @param {DomainObject} domainObject the object whose
         *        associated telemetry data is of interest
         * @param {Function} callback a function to invoke
         *        when new data has become available.
         * @param {boolean} lossless flag to indicate whether the
         *        callback should be notified for all values
         *        (otherwise, multiple values in quick succession
         *        will call back with only the latest value.)
         * @returns {platform/telemetry.TelemetrySubscription} the
         *        subscription, which will provide access to latest values.
         */
        TelemetrySubscriber.prototype.subscribe = function (domainObject, callback, lossless) {
            return new TelemetrySubscription(
                this.$q,
                this.$timeout,
                domainObject,
                callback,
                lossless
            );
        };

        return TelemetrySubscriber;
    }
);
