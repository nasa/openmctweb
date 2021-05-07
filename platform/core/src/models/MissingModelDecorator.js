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
         * Adds placeholder domain object models for any models which
         * fail to load from the underlying model service.
         * @constructor
         * @memberof platform/core
         * @param {ModelService} modelService this service to decorate
         * @implements {ModelService}
         */
        function MissingModelDecorator(modelService) {
            this.modelService = modelService;
        }

        function missingModel(id) {
            return {
                type: "unknown",
                name: "Missing: " + id
            };
        }

        MissingModelDecorator.prototype.getModels = function (ids) {
            function addMissingModels(models) {
                var result = {};
                ids.forEach(function (id) {
                    result[id] = models[id] || missingModel(id);
                });

                return result;
            }

            return this.modelService.getModels(ids).then(addMissingModels);
        };

        return MissingModelDecorator;
    }
);

