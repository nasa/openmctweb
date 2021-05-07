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
 * Module defining TelemetryController. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {

        /**
         * Serves as a reusable controller for views (or parts of views)
         * which need to issue requests for telemetry data and use the
         * results
         *
         * @memberof platform/telemetry
         * @constructor
         * @deprecated use platform/telemetry.TelemetryHandler instead
         */
        function TelemetryController($scope, $q, $timeout, $log) {

            // Private to maintain in this scope
            var self = {
                // IDs of domain objects with telemetry
                ids: [],

                // Containers for latest responses (id->response)
                // Used internally; see buildResponseContainer
                // for format
                response: {},

                // Request fields (id->requests)
                request: {},

                // Number of outstanding requests
                pending: 0,

                // Array of object metadatas, for easy retrieval
                metadatas: [],

                // Interval at which to poll for new data
                interval: 1000,

                // Flag tracking whether or not a request
                // is in progress
                refreshing: false,

                // Used to track whether a new telemetryUpdate
                // is being issued.
                broadcasting: false,

                // Active subscriptions
                subscriptions: [],

                // Used for getTelemetryObjects; a reference is
                // stored so that this can be called in a watch
                telemetryObjects: [],

                // Whether or not this controller is active; once
                // scope is destroyed, polling should stop.
                active: true
            };

            // Broadcast that a telemetryUpdate has occurred.
            function doBroadcast() {
                // This may get called multiple times from
                // multiple objects, so set a flag to suppress
                // multiple simultaneous events from being
                // broadcast, then issue the actual broadcast
                // later (via $timeout)
                if (!self.broadcasting) {
                    self.broadcasting = true;
                    $timeout(function () {
                        self.broadcasting = false;
                        $scope.$broadcast("telemetryUpdate");
                    });
                }
            }

            // Issue a request for new telemetry for one of the
            // objects being tracked by this controller
            function requestTelemetryForId(id, trackPending) {
                var responseObject = self.response[id],
                    domainObject = responseObject.domainObject,
                    telemetry = domainObject.getCapability('telemetry');

                // Callback for when data comes back
                function storeData(data) {
                    self.pending -= trackPending ? 1 : 0;
                    responseObject.data = data;
                    doBroadcast();
                }

                self.pending += trackPending ? 1 : 0;

                // Shouldn't happen, but isn't fatal,
                // so warn.
                if (!telemetry) {
                    $log.warn([
                        "Expected telemetry capability for ",
                        id,
                        " but found none. Cannot request data."
                    ].join(""));

                    // Request won't happen, so don't
                    // mark it as pending.
                    self.pending -= trackPending ? 1 : 0;

                    return;
                }

                // Issue the request using the object's telemetry capability
                return $q.when(telemetry.requestData(self.request))
                    .then(storeData);
            }

            // Request telemetry for all objects tracked by this
            // controller. A flag is passed to indicate whether the
            // pending counter should be incremented (this will
            // cause isRequestPending() to change, which we only
            // want to happen for requests which have originated
            // outside of this controller's polling action.)
            function requestTelemetry(trackPending) {
                return $q.all(self.ids.map(function (id) {
                    return requestTelemetryForId(id, trackPending);
                }));
            }

            // Subscribe to streaming telemetry updates
            function subscribe(telemetryCapability, id) {
                return telemetryCapability.subscribe(function () {
                    requestTelemetryForId(id, false);
                });
            }

            // Stop listening to active subscriptions
            function unsubscribe() {
                self.subscriptions.forEach(function (s) {
                    return s && s();
                });
                self.subscriptions = [];
            }

            // Look up domain objects which have telemetry capabilities.
            // This will either be the object in view, or object that
            // this object delegates its telemetry capability to.
            function promiseRelevantDomainObjects(domainObject) {
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
            }

            // Build the response containers that are used internally
            // by this controller to track latest responses, etc, for
            // a given domain object.
            function buildResponseContainer(domainObject) {
                var telemetry = domainObject
                        && domainObject.getCapability("telemetry"),
                    id,
                    metadata;

                if (telemetry) {
                    id = domainObject.getId();

                    self.subscriptions.push(subscribe(telemetry, id));

                    metadata = telemetry.getMetadata();

                    self.response[id] = {
                        name: domainObject.getModel().name,
                        domainObject: domainObject,
                        metadata: metadata,
                        pending: 0,
                        data: {}
                    };
                } else {
                    // Shouldn't happen, as we've checked for
                    // telemetry capabilities previously, but
                    // be defensive.
                    $log.warn([
                        "Expected telemetry capability for ",
                        domainObject.getId(),
                        " but none was found."
                    ].join(""));

                    // Create an empty container so subsequent
                    // behavior won't hit an exception.
                    self.response[domainObject.getId()] = {
                        name: domainObject.getModel().name,
                        domainObject: domainObject,
                        metadata: {},
                        pending: 0,
                        data: {}
                    };
                }
            }

            // Build response containers (as above) for all
            // domain objects, and update some controller-internal
            // state to support subsequent calls.
            function buildResponseContainers(domainObjects) {
                // Clear out any existing subscriptions
                unsubscribe();

                // Build the containers
                domainObjects.forEach(buildResponseContainer);

                // Store the reference to support getTelemetryObjects
                self.telemetryObjects = domainObjects;

                // Maintain a list of relevant ids, to convert
                // back from dictionary-like container objects to arrays.
                self.ids = domainObjects.map(function (obj) {
                    return obj.getId();
                });

                // Keep a reference to all applicable metadata
                // to return from getMetadata
                self.metadatas = self.ids.map(function (id) {
                    return self.response[id].metadata;
                });

                // Issue a request for the new objects, if we
                // know what our request looks like
                if (self.request) {
                    requestTelemetry(true);
                }
            }

            // Get relevant telemetry-providing domain objects
            // for the domain object which is represented in this
            // scope. This will be the domain object itself, or
            // its telemetry delegates, or both.
            function getTelemetryObjects(domainObject) {
                unsubscribe();
                promiseRelevantDomainObjects(domainObject)
                    .then(buildResponseContainers);
            }

            // Handle a polling refresh interval
            function startTimeout() {
                if (!self.refreshing && self.interval !== undefined) {
                    self.refreshing = true;
                    $timeout(function () {
                        if (self.request) {
                            requestTelemetry(false);
                        }

                        self.refreshing = false;

                        if (self.active) {
                            startTimeout();
                        }
                    }, self.interval);
                }
            }

            // Stop polling for changes
            function deactivate() {
                unsubscribe();
                self.active = false;
            }

            // Watch for a represented domain object
            $scope.$watch("domainObject", getTelemetryObjects);

            // Stop polling when destroyed
            $scope.$on("$destroy", deactivate);

            // Begin polling for data changes
            startTimeout();

            return {
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
                 * @returns {Array} an array of metadata objects
                 * @memberof platform/telemetry.TelemetryController#
                 */
                getMetadata: function () {
                    return self.metadatas;
                },
                /**
                 * Get all telemetry-providing domain objects managed by
                 * this controller.
                 *
                 * This will ordered in the
                 * same manner as `getMetadata()` or
                 * `getResponse()`; that is, the metadata at a
                 * given index will correspond to the telemetry-providing
                 * domain object at the same index.
                 * @returns {DomainObject[]} an array of metadata objects
                 * @memberof platform/telemetry.TelemetryController#
                 */
                getTelemetryObjects: function () {
                    return self.telemetryObjects;
                },
                /**
                 * Get the latest telemetry response for a specific
                 * domain object (if an argument is given) or for all
                 * objects managed by this controller (if no argument
                 * is supplied.)
                 *
                 * In the first form, this returns a single object; in
                 * the second form, it returns an array ordered in
                 * same manner as `getMetadata()` or
                 * `getTelemetryObjects()`; that is, the telemetry
                 * response at a given index will correspond to the
                 * telemetry-providing domain object at the same index.
                 * @returns {Array} an array of responses
                 * @memberof platform/telemetry.TelemetryController#
                 */
                getResponse: function getResponse(arg) {
                    var id = arg && (typeof arg === 'string'
                        ? arg : arg.getId());

                    if (id) {
                        return (self.response[id] || {}).data;
                    }

                    return (self.ids || []).map(getResponse);
                },
                /**
                 * Check if the latest request (not counting
                 * requests from TelemtryController's own polling)
                 * is still outstanding. Users of the TelemetryController
                 * may use this method as a condition upon which to
                 * show user feedback, such as a wait spinner.
                 *
                 * @returns {boolean} true if the request is still outstanding
                 * @memberof platform/telemetry.TelemetryController#
                 */
                isRequestPending: function () {
                    return self.pending > 0;
                },
                /**
                 * Issue a new data request. This will change the
                 * request parameters that are passed along to all
                 * telemetry capabilities managed by this controller.
                 * @memberof platform/telemetry.TelemetryController#
                 */
                requestData: function (request) {
                    self.request = request || {};

                    return requestTelemetry(true);
                },
                /**
                 * Change the interval at which this controller will
                 * perform its polling activity.
                 * @param {number} durationMillis the interval at
                 *        which to poll, in milliseconds
                 * @memberof platform/telemetry.TelemetryController#
                 */
                setRefreshInterval: function (durationMillis) {
                    self.interval = durationMillis;
                    startTimeout();
                }
            };
        }

        return TelemetryController;
    }
);
