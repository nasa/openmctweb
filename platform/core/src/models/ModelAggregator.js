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
 * Module defining ModelAggregator. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {

        /**
         * Allow domain object models to be looked up by their identifiers.
         *
         * @interface ModelService
         */

        /**
         * Get domain object models.
         *
         * This may provide either a superset or a subset of the models
         * requested. Absence of a model means it does not exist within
         * this service instance.
         *
         * @method ModelService#getModels
         * @param {string[]} ids identifiers for models desired.
         * @returns {Promise.<Object>} a promise for an object mapping
         *          string identifiers to domain object models.
         */

        /**
         * Allows multiple services which provide models for domain objects
         * to be treated as one.
         *
         * @memberof platform/core
         * @constructor
         * @implements {ModelService}
         * @param $q Angular's $q, for promises
         * @param {ModelService[]} providers the model providers to be
         *        aggregated
         */
        function ModelAggregator($q, providers) {
            this.providers = providers;
            this.$q = $q;
        }

        // Pick a domain object model to use, favoring the one
        // with the most recent timestamp
        function pick(a, b) {
            var aModified = (a || {}).modified || Number.NEGATIVE_INFINITY,
                bModified = (b || {}).modified || Number.NEGATIVE_INFINITY;

            return (aModified > bModified) ? a : (b || a);
        }

        // Merge results from multiple providers into one
        // large result object.
        function mergeModels(provided, ids) {
            var result = {};
            ids.forEach(function (id) {
                provided.forEach(function (models) {
                    if (models[id]) {
                        result[id] = pick(result[id], models[id]);
                    }
                });
            });

            return result;
        }

        ModelAggregator.prototype.getModels = function (ids) {
            return this.$q.all(this.providers.map(function (provider) {
                return provider.getModels(ids);
            })).then(function (provided) {
                return mergeModels(provided, ids);
            });
        };

        return ModelAggregator;
    }
);
