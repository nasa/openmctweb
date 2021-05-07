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
 * This bundle implements core components of Open MCT's service
 * infrastructure and information model.
 * @namespace platform/core
 */
define(
    [],
    function () {

        /**
         * Provides instances of domain objects, as retrieved by their
         * identifiers.
         *
         * @interface ObjectService
         */

        /**
         * Get a set of objects associated with a list of identifiers.
         * The provided result may contain a subset or a superset of
         * the total number of objects.
         *
         * @method ObjectService#getObjects
         * @param {string[]} ids the identifiers for domain objects
         *        of interest.
         * @return {Promise<object<string, DomainObject>>} a promise
         *         for an object containing key-value pairs, where keys
         *         are string identifiers for domain objects, and
         *         values are the corresponding domain objects themselves.
         */

        /**
         * Construct a new provider for domain objects.
         *
         * @param {ModelService} modelService the service which shall
         *        provide models (persistent state) for domain objects
         * @param {Function} instantiate a service to instantiate new
         *        domain object instances
         * @param $q Angular's $q, for promise consolidation
         * @memberof platform/core
         * @constructor
         */
        function DomainObjectProvider(modelService, instantiate) {
            this.modelService = modelService;
            this.instantiate = instantiate;
        }

        DomainObjectProvider.prototype.getObjects = function getObjects(ids) {
            var modelService = this.modelService,
                instantiate = this.instantiate;

            // Assemble the results from the model service and the
            // capability service into one value, suitable to return
            // from this service.
            function assembleResult(models) {
                var result = {};
                ids.forEach(function (id) {
                    if (models[id]) {
                        // Create the domain object
                        result[id] = instantiate(models[id], id);
                    }
                });

                return result;
            }

            return modelService.getModels(ids).then(assembleResult);
        };

        return DomainObjectProvider;
    }
);
