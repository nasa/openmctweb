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
 * This bundle decorates the persistence service to handle persistence
 * in batches, and to provide notification of persistence errors in batches
 * as well.
 * @namespace platform/persistence/queue
 */
define(
    ['./QueuingPersistenceCapability'],
    function (QueuingPersistenceCapability) {

        /**
         * Capability decorator. Adds queueing support to persistence
         * capabilities for domain objects, such that persistence attempts
         * will be handled in batches (allowing failure notification to
         * also be presented in batches.)
         *
         * @memberof platform/persistence/queue
         * @constructor
         * @implements {CapabilityService}
         * @param {platform/persistence/queue.PersistenceQueue} persistenceQueue
         * @param {CapabilityService} the decorated capability service
         */
        function QueuingPersistenceCapabilityDecorator(
            persistenceQueue,
            capabilityService
        ) {
            this.persistenceQueue = persistenceQueue;
            this.capabilityService = capabilityService;
        }

        QueuingPersistenceCapabilityDecorator.prototype.getCapabilities = function (model, id) {
            var capabilityService = this.capabilityService,
                persistenceQueue = this.persistenceQueue;

            function decoratePersistence(capabilities) {
                var originalPersistence = capabilities.persistence;
                if (originalPersistence) {
                    capabilities.persistence = function (domainObject) {
                        // Get/instantiate the original
                        var original =
                            (typeof originalPersistence === 'function')
                                ? originalPersistence(domainObject)
                                : originalPersistence;

                        // Provide a decorated version
                        return new QueuingPersistenceCapability(
                            persistenceQueue,
                            original,
                            domainObject
                        );
                    };
                }

                return capabilities;
            }

            return decoratePersistence(
                capabilityService.getCapabilities(model, id)
            );
        };

        return QueuingPersistenceCapabilityDecorator;
    }
);
