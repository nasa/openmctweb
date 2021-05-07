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
    ['./TelemetryQueue', './TelemetryTable', './TelemetryDelegator'],
    function (TelemetryQueue, TelemetryTable, TelemetryDelegator) {

        /**
         * A pool of telemetry values.
         * @interface platform/telemetry.TelemetryPool
         * @private
         */
        /**
         * Check if any value groups remain in this pool.
         * @return {boolean} true if value groups remain
         * @method platform/telemetry.TelemetryPool#isEmpty
         */
        /**
         * Retrieve the next value group from this pool.
         * This gives an object containing key-value pairs,
         * where keys and values correspond to the arguments
         * given to previous put functions.
         * @return {object} key-value pairs
         * @method platform/telemetry.TelemetryPool#poll
         */
        /**
         * Put a key-value pair into the pool.
         * @param {string} key the key to store the value under
         * @param {*} value the value to store
         * @method platform/telemetry.TelemetryPool#put
         */

        /**
         * A TelemetrySubscription tracks latest values for streaming
         * telemetry data and handles notifying interested observers.
         * It implements the interesting behavior behind the
         * `telemetrySubscriber` service.
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
         * @param {DomainObject} domainObject the object whose
         *        associated telemetry data is of interest
         * @param {Function} callback a function to invoke
         *        when new data has become available.
         * @param {boolean} lossless true if callback should be invoked
         *        once with every data point available; otherwise, multiple
         *        data events in a short period of time will only invoke
         *        the callback once, with access to the latest data
         */
        function TelemetrySubscription($q, $timeout, domainObject, callback, lossless) {
            var self = this,
                delegator = new TelemetryDelegator($q),
                pool = lossless ? new TelemetryQueue() : new TelemetryTable(),
                updatePending;

            // Look up domain objects which have telemetry capabilities.
            // This will either be the object in view, or object that
            // this object delegates its telemetry capability to.
            function promiseRelevantObjects(domainObj) {
                return delegator.promiseTelemetryObjects(domainObj);
            }

            function updateValuesFromPool() {
                var values = pool.poll();
                Object.keys(values).forEach(function (k) {
                    self.latestValues[k] = values[k];
                });
            }

            // Invoke the observer callback to notify that new streaming
            // data has become available.
            function fireCallback() {
                // Play back from queue if we are lossless
                while (!pool.isEmpty()) {
                    updateValuesFromPool();
                    // Fire callback, if one was provided
                    if (callback) {
                        callback();
                    }
                }

                // Clear the pending flag so that future updates will
                // schedule this callback.
                updatePending = false;
            }

            // Look up metadata associated with an object's telemetry
            function lookupMetadata(domainObj) {
                var telemetryCapability =
                    domainObj.getCapability("telemetry");

                return telemetryCapability
                        && telemetryCapability.getMetadata();
            }

            // Update the latest telemetry data for a specific
            // domain object. This will notify listeners.
            function update(domainObj, series) {
                var count = series && series.getPointCount();

                // Only schedule notification if there isn't already
                // a notification pending (and if we actually have
                // data)
                if (!updatePending && count) {
                    updatePending = true;
                    $timeout(fireCallback, 0);
                }

                // Update the latest-value table
                if (count > 0) {
                    pool.put(domainObj.getId(), {
                        domain: series.getDomainValue(count - 1),
                        range: series.getRangeValue(count - 1),
                        datum: self.makeDatum(domainObj, series, count - 1)
                    });
                }
            }

            // Prepare a subscription to a specific telemetry-providing
            // domain object.
            function subscribe(domainObj) {
                var telemetryCapability =
                    domainObj.getCapability("telemetry");

                return telemetryCapability.subscribe(function (telemetry) {
                    update(domainObj, telemetry);
                });
            }

            // Prepare subscriptions to all relevant telemetry-providing
            // domain objects.
            function subscribeAll(domainObjects) {
                return domainObjects.map(subscribe);
            }

            // Cache a reference to all relevant telemetry-providing
            // domain objects. This will be called during the
            // initial subscription chain; this allows `getTelemetryObjects()`
            // to return a non-Promise to simplify usage elsewhere.
            function cacheObjectReferences(objects) {
                self.telemetryObjects = objects;
                self.metadatas = objects.map(lookupMetadata);

                self.metadataById = {};
                objects.forEach(function (obj, i) {
                    self.metadataById[obj.getId()] = self.metadatas[i];
                });
                // Fire callback, as this will be the first time that
                // telemetry objects are available, or these objects
                // will have changed.
                if (callback) {
                    callback();
                }

                return objects;
            }

            function initialize() {
                // Get a reference to relevant objects (those with telemetry
                // capabilities) and subscribe to their telemetry updates.
                // Keep a reference to their promised return values, as these
                // will be unsubscribe functions. (This must be a promise
                // because delegation is supported, and retrieving delegate
                // telemetry-capable objects may be an asynchronous operation.)
                self.telemetryObjectPromise = promiseRelevantObjects(domainObject);
                self.unsubscribePromise = self.telemetryObjectPromise
                    .then(cacheObjectReferences)
                    .then(subscribeAll);
            }

            function idsMatch(ids) {
                return ids.length === self.telemetryObjects.length
                    && ids.every(function (id, index) {
                        return self.telemetryObjects[index].getId() === id;
                    });
            }

            function modelChange(model) {
                if (!idsMatch((model || {}).composition || [])) {
                    // Reinitialize if composition has changed
                    self.unsubscribeAll().then(initialize);
                }
            }

            function addMutationListener() {
                var mutation = domainObject
                    && domainObject.getCapability('mutation');
                if (mutation) {
                    return mutation.listen(modelChange);
                }
            }

            this.$q = $q;
            this.latestValues = {};
            this.telemetryObjects = [];
            this.metadatas = [];

            initialize();
            this.unlistenToMutation = addMutationListener();
        }

        /**
         * From a telemetry series, retrieve a single data point
         * containing all fields for domains/ranges
         * @private
         */
        TelemetrySubscription.prototype.makeDatum = function (domainObject, series, index) {
            var id = domainObject && domainObject.getId(),
                metadata = (id && this.metadataById[id]) || {},
                result = {};

            (metadata.domains || []).forEach(function (domain) {
                result[domain.key] =
                    series.getDomainValue(index, domain.key);
            });

            (metadata.ranges || []).forEach(function (range) {
                result[range.key] =
                    series.getRangeValue(index, range.key);
            });

            return result;
        };

        /**
         * Terminate all underlying subscriptions.
         * @private
         */
        TelemetrySubscription.prototype.unsubscribeAll = function () {
            var $q = this.$q;

            return this.unsubscribePromise.then(function (unsubscribes) {
                return $q.all(unsubscribes.map(function (unsubscribe) {
                    return unsubscribe();
                }));
            });
        };

        /**
         * Terminate all underlying subscriptions associated
         * with this object.
         */
        TelemetrySubscription.prototype.unsubscribe = function () {
            if (this.unlistenToMutation) {
                this.unlistenToMutation();
            }

            return this.unsubscribeAll();
        };

        /**
         * Get the most recent domain value that has been observed
         * for the specified domain object. This will typically be
         * a timestamp.
         *
         * The domain object passed here should be one that is
         * subscribed-to here; that is, it should be one of the
         * domain objects returned by `getTelemetryObjects()`.
         *
         * @param {DomainObject} domainObject the object of interest
         * @param {string} [key] the symbolic identifier of the domain
         *        to look up; if omitted, the value for this object's
         *        default domain will be used
         * @returns the most recent domain value observed
         */
        TelemetrySubscription.prototype.getDomainValue = function (domainObject, key) {
            var id = domainObject.getId(),
                latestValue = this.latestValues[id];

            return latestValue && (key
                ? latestValue.datum[key]
                : latestValue.domain);
        };

        /**
         * Get the most recent range value that has been observed
         * for the specified domain object. This will typically
         * be a numeric measurement.
         *
         * The domain object passed here should be one that is
         * subscribed-to here; that is, it should be one of the
         * domain objects returned by `getTelemetryObjects()`.
         *
         * @param {DomainObject} domainObject the object of interest
         * @param {string} [key] the symbolic identifier of the range
         *        to look up; if omitted, the value for this object's
         *        default range will be used
         * @returns the most recent range value observed
         */
        TelemetrySubscription.prototype.getRangeValue = function (domainObject, key) {
            var id = domainObject.getId(),
                latestValue = this.latestValues[id];

            return latestValue && (key
                ? latestValue.datum[key]
                : latestValue.range);
        };

        /**
         * Get the latest telemetry datum for this domain object.
         *
         * @param {DomainObject} domainObject the object of interest
         * @returns {TelemetryDatum} the most recent datum
         */
        TelemetrySubscription.prototype.getDatum = function (domainObject) {
            var id = domainObject.getId();

            return (this.latestValues[id] || {}).datum;
        };

        /**
         * Get all telemetry-providing domain objects which are
         * being observed as part of this subscription.
         *
         * Capability delegation will be taken into account (so, if
         * a Telemetry Panel was passed in the constructor, this will
         * return its contents.) Capability delegation is resolved
         * asynchronously so the return value here may change over
         * time; while this resolution is pending, this method will
         * return an empty array.
         *
         * @returns {DomainObject[]} all subscribed-to domain objects
         */
        TelemetrySubscription.prototype.getTelemetryObjects = function () {
            return this.telemetryObjects;
        };

        /**
         * Get all telemetry metadata associated with
         * telemetry-providing domain objects managed by
         * this controller.
         *
         * This will ordered in the
         * same manner as `getTelemetryObjects()` or
         * `getResponse()`; that is, the metadata at a
         * given index will correspond to the telemetry-providing
         * domain object at the same index.
         * @returns {TelemetryMetadata[]} an array of metadata objects
         */
        TelemetrySubscription.prototype.getMetadata = function () {
            return this.metadatas;
        };

        /**
         * Get a promise for all telemetry-providing objects
         * associated with this subscription.
         * @returns {Promise.<DomainObject[]>} a promise for
         *          telemetry-providing objects
         * @memberof platform/telemetry.TelemetrySubscription#
         */
        TelemetrySubscription.prototype.promiseTelemetryObjects = function () {
            // Unsubscribe promise is available after objects
            // are loaded.
            return this.telemetryObjectPromise;
        };

        return TelemetrySubscription;

    }
);

