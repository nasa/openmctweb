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
         * Handles actual persistence invocations for queued persistence
         * attempts, in a group. Handling in a group in this manner
         * also allows failure to be handled in a group (e.g. in a single
         * summary dialog.)
         * @param $q Angular's $q, for promises
         * @param {PersistenceFailureHandler} handler to invoke in the event
         *        that a persistence attempt fails.
         * @constructor
         * @memberof platform/persistence/queue
         */
        function PersistenceQueueHandler($q, failureHandler) {
            this.$q = $q;
            this.failureHandler = failureHandler;
        }

        /**
         * Invoke the persist method on the provided persistence
         * capabilities.
         * @param {Object.<string,PersistenceCapability>} persistences
         *        capabilities to invoke, in id->capability pairs.
         * @param {Object.<string,DomainObject>} domainObjects
         *        associated domain objects, in id->object pairs.
         * @param {PersistenceQueue} queue the persistence queue,
         *        to requeue as necessary
         * @memberof platform/persistence/queue.PersistenceQueueHandler#
         */
        PersistenceQueueHandler.prototype.persist = function (persistences, domainObjects, queue) {
            var ids = Object.keys(persistences),
                $q = this.$q,
                failureHandler = this.failureHandler;

            // Handle a group of persistence invocations
            function persistGroup(groupIds, persistenceCaps, domainObjs, pQueue) {
                var failures = [];

                // Try to persist a specific domain object
                function tryPersist(id) {
                    // Look up its persistence capability from the provided
                    // id->persistence object.
                    var persistence = persistenceCaps[id],
                        domainObject = domainObjs[id];

                    // Put a domain object back in the queue
                    // (e.g. after Overwrite)
                    function requeue() {
                        return pQueue.put(domainObject, persistence);
                    }

                    // Handle success
                    function succeed(value) {
                        return value;
                    }

                    // Handle failure (build up a list of failures)
                    function fail(error) {
                        failures.push({
                            id: id,
                            persistence: persistence,
                            domainObject: domainObject,
                            requeue: requeue,
                            error: error
                        });

                        return false;
                    }

                    // Invoke the actual persistence capability, then
                    // note success or failures
                    return persistence.persist().then(succeed, fail);
                }

                // Handle any failures from the full operation
                function handleFailure(value) {
                    return failures.length > 0
                        ? failureHandler.handle(failures)
                        : value;
                }

                // Try to persist everything, then handle any failures
                return $q.all(groupIds.map(tryPersist)).then(handleFailure);
            }

            return persistGroup(ids, persistences, domainObjects, queue);
        };

        return PersistenceQueueHandler;
    }
);
