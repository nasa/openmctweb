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
         * Relationship capability. Describes a domain objects relationship
         * to other domain objects within the system, and provides a way to
         * access related objects.
         *
         * For most cases, this is not the capability to use; the
         * `composition` capability describes the more general relationship
         * between objects typically seen (e.g. in the tree.) This capability
         * is instead intended for the more unusual case of relationships
         * which are not intended to appear in the tree, but are instead
         * intended only for special, limited usage.
         *
         * @memberof platform/core
         * @constructor
         * @implements {Capability}
         */
        function RelationshipCapability($injector, domainObject) {
            // Get a reference to the object service from $injector
            this.injectObjectService = function () {
                this.objectService = $injector.get("objectService");
            };

            this.lastPromise = {};
            this.domainObject = domainObject;
        }

        /**
         * List all types of relationships exposed by this
         * object.
         * @returns {string[]} a list of all relationship types
         */
        RelationshipCapability.prototype.listRelationships = function listRelationships() {
            var relationships =
                (this.domainObject.getModel() || {}).relationships || {};

            // Check if this key really does expose an array of ids
            // (to filter out malformed relationships)
            function isArray(key) {
                return Array.isArray(relationships[key]);
            }

            return Object.keys(relationships).filter(isArray).sort();
        };

        /**
         * Request related objects, with a given relationship type.
         * This will typically require asynchronous lookup, so this
         * returns a promise.
         * @param {string} key the type of relationship
         * @returns {Promise.<DomainObject[]>} a promise for related
         *          domain objects
         */
        RelationshipCapability.prototype.getRelatedObjects = function (key) {
            var model = this.domainObject.getModel(),
                ids;

            // Package objects as an array
            function packageObject(objects) {
                return ids.map(function (id) {
                    return objects[id];
                }).filter(function (obj) {
                    return obj;
                });
            }

            // Clear cached promises if modification has occurred
            if (this.lastModified !== model.modified) {
                this.lastPromise = {};
                this.lastModified = model.modified;
            }

            // Make a new request if needed
            if (!this.lastPromise[key]) {
                ids = (model.relationships || {})[key] || [];
                this.lastModified = model.modified;
                // Lazily initialize object service now that we need it
                if (!this.objectService) {
                    this.injectObjectService();
                }

                // Load from the underlying object service
                this.lastPromise[key] = this.objectService.getObjects(ids)
                    .then(packageObject);
            }

            return this.lastPromise[key];
        };

        /**
         * Test to determine whether or not this capability should be exposed
         * by a domain object based on its model. Checks for the presence of
         * a `relationships` field, that must be an object.
         * @param model the domain object model
         * @returns {boolean} true if this object has relationships
         */
        RelationshipCapability.appliesTo = function (model) {
            return Boolean((model || {}).relationships);
        };

        return RelationshipCapability;
    }
);
