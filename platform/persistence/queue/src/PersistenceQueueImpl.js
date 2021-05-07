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
         * The PersistenceQueue is used by the QueuingPersistenceCapability
         * to aggregrate calls for object persistence. These are then issued
         * in a group, such that if some or all are rejected, this result can
         * be shown to the user (again, in a group.)
         *
         * This implementation is separate out from PersistenceQueue, which
         * handles the wiring of injected dependencies into an instance of
         * this class.
         *
         * @param $timeout Angular's $timeout
         * @param {PersistenceQueueHandler} handler handles actual
         *        persistence when the queue is flushed
         * @param {number} [DELAY] optional; delay in milliseconds between
         *        attempts to flush the queue
         * @constructor
         * @memberof platform/persistence/queue
         */
        function PersistenceQueueImpl($q, $timeout, handler, delay) {

            this.persistences = {};
            this.objects = {};
            this.lastObservedSize = 0;
            this.activeDefer = $q.defer();

            // If no delay is provided, use a default
            this.delay = delay || 0;
            this.handler = handler;
            this.$timeout = $timeout;
            this.$q = $q;
        }

        // Schedule a flushing of the queue (that is, plan to flush
        // all objects in the queue)
        PersistenceQueueImpl.prototype.scheduleFlush = function () {
            var self = this,
                $timeout = this.$timeout,
                $q = this.$q,
                handler = this.handler;

            // Check if the queue's size has stopped increasing)
            function quiescent() {
                return Object.keys(self.persistences).length
                    === self.lastObservedSize;
            }

            // Persist all queued objects
            function flush() {
                // Get a local reference to the active promise;
                // this will be replaced with a promise for the next round
                // of persistence calls, so we want to make sure we clear
                // the correct one when this flush completes.
                var flushingDefer = self.activeDefer;

                // Clear the active promise for a queue flush
                function clearFlushPromise(value) {
                    self.flushPromise = undefined;
                    flushingDefer.resolve(value);

                    return value;
                }

                // Persist all queued objects
                self.flushPromise = handler.persist(
                    self.persistences,
                    self.objects,
                    self
                ).then(clearFlushPromise, clearFlushPromise);

                // Reset queue, etc.
                self.persistences = {};
                self.objects = {};
                self.lastObservedSize = 0;
                self.pendingTimeout = undefined;
                self.activeDefer = $q.defer();
            }

            function maybeFlush() {
                // Timeout fired, so clear it
                self.pendingTimeout = undefined;
                // Only flush when we've stopped receiving updates
                if (quiescent()) {
                    flush();
                } else {
                    self.scheduleFlush();
                }

                // Update lastObservedSize to detect quiescence
                self.lastObservedSize = Object.keys(self.persistences).length;
            }

            // If we are already flushing the queue...
            if (self.flushPromise) {
                // Wait until that's over before considering a flush
                self.flushPromise.then(maybeFlush);
            } else {
                // Otherwise, schedule a flush on a timeout (to give
                // a window for other updates to get aggregated)
                self.pendingTimeout = self.pendingTimeout
                        || $timeout(maybeFlush, self.delay, false);
            }

            return self.activeDefer.promise;
        };

        /**
         * Queue persistence of a domain object.
         * @param {DomainObject} domainObject the domain object
         * @param {PersistenceCapability} persistence the object's
         *        undecorated persistence capability
         * @returns {Promise} a promise which will resolve upon persistence
         */
        PersistenceQueueImpl.prototype.put = function (domainObject, persistence) {
            var id = domainObject.getId();
            this.persistences[id] = persistence;
            this.objects[id] = domainObject;

            return this.scheduleFlush();
        };

        return PersistenceQueueImpl;
    }
);
