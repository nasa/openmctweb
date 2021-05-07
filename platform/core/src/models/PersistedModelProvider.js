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
 * Module defining PersistedModelProvider. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {

        /**
         * A model service which reads domain object models from an external
         * persistence service.
         *
         * Identifiers will be interpreted as follows:
         * * If no colon is present, the model will be read from the default
         *   persistence space.
         * * If a colon is present, everything before the first colon will be
         *   taken to refer to the persistence space, and everything after
         *   will be taken to be that model's key within this space. (If
         *   no such space exists within the `persistenceService`, that
         *   identifier will simply be ignored.)
         *
         * @memberof platform/core
         * @constructor
         * @implements {ModelService}
         * @param {PersistenceService} persistenceService the service in which
         *        domain object models are persisted.
         * @param $q Angular's $q service, for working with promises
         * @param {function} now a function which provides the current time
         * @param {string} space the name of the persistence space(s)
         *        from which models should be retrieved by default
         */
        function PersistedModelProvider(persistenceService, $q, now, space) {
            this.persistenceService = persistenceService;
            this.$q = $q;
            this.now = now;
            this.defaultSpace = space;
        }

        PersistedModelProvider.prototype.getModels = function (ids) {
            var persistenceService = this.persistenceService,
                $q = this.$q,
                now = this.now,
                defaultSpace = this.defaultSpace,
                parsedIds;

            // Load a single object model from any persistence spaces
            function loadModel(parsedId) {
                return persistenceService
                    .readObject(parsedId.space, parsedId.key);
            }

            // Ensure that models read from persistence have some
            // sensible timestamp indicating they've been persisted.
            function addPersistedTimestamp(model) {
                if (model && (model.persisted === undefined)) {
                    model.persisted = model.modified !== undefined
                        ? model.modified : now();
                }

                return model;
            }

            // Package the result as id->model
            function packageResult(parsedIdsToPackage, models) {
                var result = {};
                parsedIdsToPackage.forEach(function (parsedId, index) {
                    var id = parsedId.id;
                    if (models[index]) {
                        result[id] = models[index];
                    }
                });

                return result;
            }

            function loadModels(parsedIdsToLoad) {
                return $q.all(parsedIdsToLoad.map(loadModel))
                    .then(function (models) {
                        return packageResult(
                            parsedIdsToLoad,
                            models.map(addPersistedTimestamp)
                        );
                    });
            }

            function restrictToSpaces(spaces) {
                return parsedIds.filter(function (parsedId) {
                    return spaces.indexOf(parsedId.space) !== -1;
                });
            }

            parsedIds = ids.map(function (id) {
                var parts = id.split(":");

                return (parts.length > 1)
                    ? {
                        id: id,
                        space: parts[0],
                        key: parts.slice(1).join(":")
                    }
                    : {
                        id: id,
                        space: defaultSpace,
                        key: id
                    };
            });

            return persistenceService.listSpaces()
                .then(restrictToSpaces)
                .then(loadModels);
        };

        return PersistedModelProvider;
    }
);
