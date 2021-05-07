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
         * This class encapsulates the process of copying a domain object
         * and all of its children.
         *
         * @param {DomainObject} domainObject The object to copy
         * @param {DomainObject} parent The new location of the cloned object tree
         * @param {platform/entanglement.CopyService~filter} filter
         *        a function used to filter out objects from
         *        the cloning process
         * @param $q Angular's $q, for promises
         * @constructor
         */
        function CopyTask(domainObject, parent, filter, $q) {
            this.domainObject = domainObject;
            this.parent = parent;
            this.firstClone = undefined;
            this.$q = $q;
            this.deferred = undefined;
            this.filter = filter;
            this.persisted = 0;
            this.clones = [];
            this.idMap = {};
        }

        function composeChild(child, parent, setLocation) {
            //Once copied, associate each cloned
            // composee with its parent clone

            parent.getModel().composition.push(child.getId());

            //If a location is not specified, set it.
            if (setLocation && child.getModel().location === undefined) {
                child.getModel().location = parent.getId();
            }

            return child;
        }

        function cloneObjectModel(objectModel) {
            var clone = JSON.parse(JSON.stringify(objectModel));

            /**
             * Reset certain fields.
             */
            //If has a composition, set it to an empty array. Will be
            // recomposed later with the ids of its cloned children.
            if (clone.composition) {
                //Important to set it to an empty array here, otherwise
                // hasCapability("composition") returns false;
                clone.composition = [];
            }

            delete clone.persisted;
            delete clone.modified;
            delete clone.location;

            return clone;
        }

        /**
         * Will persist a list of {@link objectClones}. It will persist all
         * simultaneously, irrespective of order in the list. This may
         * result in automatic request batching by the browser.
         */
        function persistObjects(self) {
            return self.$q.all(self.clones.map(function (clone) {
                return clone.getCapability("persistence").persist().then(function () {
                    self.deferred.notify({
                        phase: "copying",
                        totalObjects: self.clones.length,
                        processed: ++self.persisted
                    });
                });
            })).then(function () {
                return self;
            });
        }

        /**
         * Will add a list of clones to the specified parent's composition
         */
        function addClonesToParent(self) {
            return self.parent.getCapability("composition")
                .add(self.firstClone)
                .then(function (addedClone) {
                    return self.parent.getCapability("persistence").persist()
                        .then(function () {
                            return addedClone;
                        });
                });
        }

        /**
         * Update identifiers in a cloned object model (or part of
         * a cloned object model) to reflect new identifiers after
         * copying.
         * @private
         */
        CopyTask.prototype.rewriteIdentifiers = function (obj, idMap) {
            function lookupValue(value) {
                return (typeof value === 'string' && idMap[value]) || value;
            }

            if (Array.isArray(obj)) {
                obj.forEach(function (value, index) {
                    obj[index] = lookupValue(value);
                    this.rewriteIdentifiers(obj[index], idMap);
                }, this);
            } else if (obj && typeof obj === 'object') {
                Object.keys(obj).forEach(function (key) {
                    var value = obj[key];
                    obj[key] = lookupValue(value);
                    if (idMap[key]) {
                        delete obj[key];
                        obj[idMap[key]] = value;
                    }

                    this.rewriteIdentifiers(value, idMap);
                }, this);
            }
        };

        /**
         * Given an array of objects composed by a parent, clone them, then
         * add them to the parent.
         * @private
         * @returns {*}
         */
        CopyTask.prototype.copyComposees = function (composees, clonedParent, originalParent) {
            var self = this,
                idMap = {};

            return (composees || []).reduce(function (promise, originalComposee) {
                //If the composee is composed of other
                // objects, chain a promise..
                return promise.then(function () {
                    // ...to recursively copy it (and its children)
                    return self.copy(originalComposee, originalParent).then(function (clonedComposee) {
                        //Map the original composee's ID to that of its
                        // clone so that we can replace any references to it
                        // in the parent
                        idMap[originalComposee.getId()] = clonedComposee.getId();

                        //Compose the child within its parent. Cloned
                        // objects will need to also have their location
                        // set, however linked objects will not.
                        return composeChild(clonedComposee, clonedParent, clonedComposee !== originalComposee);
                    });
                });
            }, self.$q.when(undefined)
            ).then(function () {
                //Replace any references in the cloned parent to
                // contained objects that have been composed with the
                // Ids of the clones
                self.rewriteIdentifiers(clonedParent.getModel(), idMap);

                //Add the clone to the list of clones that will
                //be returned by this function
                self.clones.push(clonedParent);

                return clonedParent;
            });
        };

        /**
         * A recursive function that will perform a bottom-up copy of
         * the object tree with originalObject at the root. Recurses to
         * the farthest leaf, then works its way back up again,
         * cloning objects, and composing them with their child clones
         * as it goes
         * @private
         * @returns {DomainObject} If the type of the original object allows for
         * duplication, then a duplicate of the object, otherwise the object
         * itself (to allow linking to non duplicatable objects).
         */
        CopyTask.prototype.copy = function (originalObject) {
            var self = this,
                clone;

            //Check if the type of the object being copied allows for
            // creation of new instances. If it does not, then a link to the
            // original will be created instead.
            if (this.filter(originalObject)) {
                //create a new clone of the original object. Use the
                // creation capability of the targetParent to create the
                // new clone. This will ensure that the correct persistence
                // space is used.
                clone = this.parent.useCapability("instantiation", cloneObjectModel(originalObject.getModel()));

                //Iterate through child tree
                return this.$q.when(originalObject.useCapability('composition')).then(function (composees) {
                    self.deferred.notify({phase: "preparing"});

                    //Duplicate the object's children, and their children, and
                    // so on down to the leaf nodes of the tree.
                    //If it is a link, don't both with children
                    return self.copyComposees(composees, clone, originalObject);
                });
            } else {
                //Creating a link, no need to iterate children
                return self.$q.when(originalObject);
            }

        };

        /**
         * Will build a graph of an object and all of its child objects in
         * memory
         * @private
         * @param domainObject The original object to be copied
         * @param parent The parent of the original object to be copied
         * @returns {Promise} resolved with an array of clones of the models
         * of the object tree being copied. Copying is done in a bottom-up
         * fashion, so that the last member in the array is a clone of the model
         * object being copied. The clones are all full composed with
         * references to their own children.
         */
        CopyTask.prototype.buildCopyPlan = function () {
            var self = this;

            return this.copy(self.domainObject, self.parent).then(function (domainObjectClone) {
                if (domainObjectClone !== self.domainObject) {
                    domainObjectClone.getModel().location = self.parent.getId();
                }

                self.firstClone = domainObjectClone;

                return self;
            });
        };

        /**
         * Execute the copy task with the objects provided in the constructor.
         * @returns {promise} Which will resolve with a clone of the object
         * once complete.
         */
        CopyTask.prototype.perform = function () {
            this.deferred = this.$q.defer();

            this.buildCopyPlan()
                .then(persistObjects)
                .then(addClonesToParent)
                .then(this.deferred.resolve, this.deferred.reject);

            return this.deferred.promise;
        };

        return CopyTask;
    }
);
