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
 * Module defining StaticModelProvider. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {

        /**
         * Loads static models, provided as declared extensions of bundles.
         * @memberof platform/core
         * @constructor
         */
        function StaticModelProvider(models, $q, $log) {
            var modelMap = {};

            function addModelToMap(model) {
                // Skip models which don't look right
                if (typeof model !== 'object'
                        || typeof model.id !== 'string'
                            || typeof model.model !== 'object') {
                    $log.warn([
                        "Skipping malformed domain object model exposed by ",
                        ((model || {}).bundle || {}).path
                    ].join(""));
                } else {
                    modelMap[model.id] = model.model;
                }
            }

            // Prepopulate maps with models to make subsequent lookup faster.
            models.forEach(addModelToMap);

            this.modelMap = modelMap;
            this.$q = $q;
        }

        StaticModelProvider.prototype.getModels = function (ids) {
            var modelMap = this.modelMap,
                result = {};
            ids.forEach(function (id) {
                result[id] = modelMap[id];
            });

            return this.$q.when(result);
        };

        return StaticModelProvider;
    }
);
