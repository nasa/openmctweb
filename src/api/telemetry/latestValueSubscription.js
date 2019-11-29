/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

], function (

) {

    /**
     * Subscribe to receive the latest telemetry value for a given domain
     * object. The callback will be called whenever newer data is received from
     * a realtime provider.  If a LAD provider is available, Open MCT will use
     * it to provide an initial value for the latest data subscriber.
     *
     * Using this method will ensure that you only receive telemetry values in
     * order, according to the current time system.  If openmct receives a new
     * telemetry value from a provider that occurs out of order, i.e. the
     * timestamp is less than the last received timestamp, then it will discard
     * the message instead of notifying the callback.  In a telemetry system
     * where data may be processed out of order, this guarantees that the end
     * user is always viewing the latest data.
     *
     * If the user changes the time system, Open MCT will attempt to provide
     * a new value from the LAD data provider and continue to provide new values
     * via realtime providers.
     *
     * @param {module:openmct.DomainObject} domainObject the object
     *        which has associated telemetry
     * @param {Function} callback the callback to invoke with new data, as
     *        it becomes available
     * @returns {Function} a function which may be called to terminate
     *          the subscription
     */
    function latestValueSubscription(
        domainObject,
        callback,
        telemetryAPI,
        openmct
    ) {
        var latestDatum;
        var pendingRealtimeDatum;
        var currentRequest = 0;
        var metadata = telemetryAPI.getMetadata(domainObject);
        var formatters = telemetryAPI.getFormatMap(metadata);
        var timeFormatter;
        var active = true;
        var restrictToBounds = false;

        function isLater(a, b) {
            return !timeFormatter || timeFormatter.parse(a) > timeFormatter.parse(b);
        }

        function applyBoundsFilter(datum) {
            if (withinBounds(datum)) {
                callback(datum);
            }
        }

        function withinBounds(datum) {
            if (!restrictToBounds || !timeFormatter) {
                return true;
            }
            var timestamp = timeFormatter.parse(datum);
            var bounds = openmct.time.bounds();
            if (timestamp >= bounds.start && timestamp <= bounds.end) {
                return true;
            }
        }

        function updateClock(clock) {
            // We restrict to bounds if there is no clock (aka fixed mode) to
            // prevent users from seeing data they don't expect.
            restrictToBounds = !clock;
        }

        function callbackIfLatest(datum) {
            if (!active) {
                return; // prevent LAD notify after unsubscribe.
            }
            // If we don't have latest data, store datum for later processing.
            if (typeof latestDatum === 'undefined') {
                if (typeof pendingRealtimeDatum === 'undefined' || (
                        isLater(datum, pendingRealtimeDatum) &&
                        withinBounds(datum)
                    )) {

                    pendingRealtimeDatum = datum;
                }
                return;
            }
            // If there is no latest data, or datum is latest, then notify
            // subscriber.
            if (latestDatum === false || isLater(datum, latestDatum)) {
                latestDatum = datum;
                applyBoundsFilter(datum);
            }
        }

        function updateTimeSystem(timeSystem) {
            // Reset subscription state, request new latest data and wait for
            // response before filtering lad data.
            latestDatum = undefined;
            pendingRealtimeDatum = undefined;
            timeFormatter = formatters[timeSystem.key];

            currentRequest++;
            var thisRequest = currentRequest;
            telemetryAPI.request(domainObject, {strategy: 'latest', size: 1})
                .then(function (results) {
                    return results[results.length - 1];
                }, function (error) {
                    return undefined;
                })
                .then(function (datum) {
                    if (currentRequest !== thisRequest) {
                        return; // prevent race.
                    }
                    if (!datum || !withinBounds(datum)) {
                        latestDatum = false;
                    } else {
                        latestDatum = datum;
                        applyBoundsFilter(datum);
                    }
                    if (pendingRealtimeDatum) {
                        callbackIfLatest(pendingRealtimeDatum);
                        pendingRealtimeDatum = undefined;
                    }
                });
        }

        function reloadInFixedMode(bounds, isTick) {
            if (isTick || openmct.time.clock()) {
                return;
            }
            updateTimeSystem(openmct.time.timeSystem());
        }

        openmct.time.on('clock', updateClock);
        openmct.time.on('timeSystem', updateTimeSystem);
        openmct.time.on('bounds', reloadInFixedMode);
        var internalUnsubscribe = telemetryAPI.subscribe(domainObject, callbackIfLatest);

        updateClock(openmct.time.clock());
        updateTimeSystem(openmct.time.timeSystem());

        return function unsubscribe() {
            active = false;
            internalUnsubscribe();
            openmct.time.off('clock', updateClock);
            openmct.time.off('timeSystem', updateTimeSystem);
            openmct.time.off('bounds', reloadInFixedMode);
        }
    };



    return latestValueSubscription
});
