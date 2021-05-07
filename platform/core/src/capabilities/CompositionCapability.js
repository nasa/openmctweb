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
 * Module defining CompositionCapability. Created by vwoeltje on 11/7/14.
 */
define(
    ['./ContextualDomainObject'],
    function (ContextualDomainObject) {

        /**
         * Composition capability. A domain object's composition is the set of
         * domain objects it contains. This is available as an array of
         * identifiers in the model; the composition capability makes this
         * available as an array of domain object instances, which may
         * require consulting the object service (e.g. to trigger a database
         * query to retrieve the nested object models.)
         *
         * @memberof platform/core
         * @constructor
         * @implements {Capability}
         */
        function CompositionCapability($injector, domainObject) {
            // Get a reference to the object service from $injector
            this.injectObjectService = function () {
                this.objectService = $injector.get("objectService");
            };

            this.domainObject = domainObject;
        }

        /**
         * Add a domain object to the composition of this domain object.
         *
         * If no index is given, this is added to the end of the composition.
         *
         * @param {DomainObject|string} domainObject the domain object to add,
         *        or simply its identifier
         * @param {number} [index] the index at which to add the object
         * @returns {Promise.<DomainObject>} a promise for the added object
         *          in its new context
         */
        CompositionCapability.prototype.add = function (domainObject, index) {
            var self = this,
                id = typeof domainObject === 'string'
                    ? domainObject : domainObject.getId(),
                model = self.domainObject.getModel(),
                composition = model.composition,
                oldIndex = composition.indexOf(id);

            // Find the object with the above id, used to contextualize
            function findObject(objects) {
                var i;
                for (i = 0; i < objects.length; i += 1) {
                    if (objects[i].getId() === id) {
                        return objects[i];
                    }
                }
            }

            function contextualize(mutationResult) {
                return mutationResult && self.invoke().then(findObject);
            }

            function addIdToModel(objModel) {
                // Pick a specific index if needed.
                index = isNaN(index) ? composition.length : index;
                // Also, don't put past the end of the array
                index = Math.min(composition.length, index);

                // Remove the existing instance of the id
                if (oldIndex !== -1) {
                    objModel.composition.splice(oldIndex, 1);
                }

                // ...and add it back at the appropriate index.
                objModel.composition.splice(index, 0, id);
            }

            // If no index has been specified already and the id is already
            // present, nothing to do. If the id is already at that index,
            // also nothing to do, so cancel mutation.
            if ((isNaN(index) && oldIndex !== -1) || (index === oldIndex)) {
                return contextualize(true);
            }

            return this.domainObject.useCapability('mutation', addIdToModel)
                .then(contextualize);
        };

        /**
         * Request the composition of this object.
         * @returns {Promise.<DomainObject[]>} a list of all domain
         *     objects which compose this domain object.
         */
        CompositionCapability.prototype.invoke = function () {
            var domainObject = this.domainObject,
                model = domainObject.getModel(),
                ids;

            // Then filter out non-existent objects,
            // and wrap others (such that they expose a
            // "context" capability)
            function contextualizeObjects(objects) {
                return ids.filter(function (id) {
                    return objects[id];
                }).map(function (id) {
                    return new ContextualDomainObject(objects[id], domainObject);
                });
            }

            // Lazily acquire object service (avoids cyclical dependency)
            if (!this.objectService) {
                this.injectObjectService();
            }

            // Make a new request if we haven't made one, or if the
            // object has been modified.
            if (!this.lastPromise || this.lastModified !== model.modified) {
                ids = model.composition || [];
                this.lastModified = model.modified;
                // Load from the underlying object service
                this.lastPromise = this.objectService.getObjects(ids)
                    .then(contextualizeObjects);
            }

            return this.lastPromise;
        };

        /**
         * Test to determine whether or not this capability should be exposed
         * by a domain object based on its model. Checks for the presence of
         * a composition field, that must be an array.
         * @param model the domain object model
         * @returns {boolean} true if this object has a composition
         */
        CompositionCapability.appliesTo = function (model) {
            return Array.isArray((model || {}).composition);
        };

        return CompositionCapability;
    }
);
