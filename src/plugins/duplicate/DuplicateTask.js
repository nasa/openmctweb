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

import uuid from 'uuid';

/**
 * This class encapsulates the process of  duplicating/copying a domain object
 * and all of its children.
 *
 * @param {DomainObject} domainObject The object to duplicate
 * @param {DomainObject} parent The new location of the cloned object tree
 * @param {src/plugins/duplicate.DuplicateService~filter} filter
 *        a function used to filter out objects from
 *        the cloning process
 * @constructor
 */
export default class DuplicateTask {

    constructor(openmct) {
        this.domainObject = undefined;
        this.parent = undefined;
        this.firstClone = undefined;
        this.filter = undefined;
        this.persisted = 0;
        this.clones = [];
        this.idMap = {};

        this.openmct = openmct;
    }

    /**
     * Execute the duplicate/copy task with the objects provided.
     * @returns {promise} Which will resolve with a clone of the object
     * once complete.
     */
    async duplicate(domainObject, parent, filter) {
        this.domainObject = domainObject;
        this.parent = parent;
        this.namespace = parent.identifier.namespace;
        this.filter = filter || this.isCreatable;

        await this.buildDuplicationPlan();
        await this.persistObjects();
        await this.addClonesToParent();

        return this.firstClone;
    }

    /**
     * Will build a graph of an object and all of its child objects in
     * memory
     * @private
     * @param domainObject The original object to be copied
     * @param parent The parent of the original object to be copied
     * @returns {Promise} resolved with an array of clones of the models
     * of the object tree being copied. Duplicating is done in a bottom-up
     * fashion, so that the last member in the array is a clone of the model
     * object being copied. The clones are all full composed with
     * references to their own children.
     */
    async buildDuplicationPlan() {
        let domainObjectClone = await this.duplicateObject(this.domainObject);

        if (domainObjectClone !== this.domainObject) {
            domainObjectClone.location = this.getKeyString(this.parent);
        }

        this.firstClone = domainObjectClone;

        return;
    }

    /**
     * Will persist a list of {@link objectClones}. It will persist all
     * simultaneously, irrespective of order in the list. This may
     * result in automatic request batching by the browser.
     */
    async persistObjects() {
        let initialCount = this.clones.length;
        let dialog = this.openmct.overlays.progressDialog({
            progressPerc: 0,
            message: `Duplicating ${initialCount} objects.`,
            iconClass: 'info',
            title: 'Duplicating'
        });

        let clonesDone = Promise.all(this.clones.map((clone) => {
            let percentPersisted = Math.ceil(100 * (++this.persisted / initialCount));
            let message = `Duplicating ${initialCount - this.persisted} objects.`;

            dialog.updateProgress(percentPersisted, message);

            return this.openmct.objects.save(clone);
        }));

        await clonesDone;

        dialog.dismiss();
        this.openmct.notifications.info(`Duplicated ${this.persisted} objects.`);

        return;
    }

    /**
     * Will add a list of clones to the specified parent's composition
     */
    async addClonesToParent() {
        let parentComposition = this.openmct.composition.get(this.parent);
        await parentComposition.load();
        parentComposition.add(this.firstClone);

        return;
    }

    /**
     * A recursive function that will perform a bottom-up duplicate of
     * the object tree with originalObject at the root. Recurses to
     * the farthest leaf, then works its way back up again,
     * cloning objects, and composing them with their child clones
     * as it goes
     * @private
     * @returns {DomainObject} If the type of the original object allows for
     * duplication, then a duplicate of the object, otherwise the object
     * itself (to allow linking to non duplicatable objects).
     */
    async duplicateObject(originalObject) {
        // Check if the creatable (or other passed in filter).
        if (this.filter(originalObject)) {
            let clone = this.cloneObjectModel(originalObject);
            let composeesCollection = this.openmct.composition.get(originalObject);
            let composees;

            if (composeesCollection) {
                composees = await composeesCollection.load();
            }

            return this.duplicateComposees(clone, composees);
        }

        // Not creatable, creating a link, no need to iterate children
        return originalObject;
    }

    /**
     * Given an array of objects composed by a parent, clone them, then
     * add them to the parent.
     * @private
     * @returns {*}
     */
    async duplicateComposees(clonedParent, composees = []) {
        let idMappings = [];
        let allComposeesDuplicated = composees.reduce(async (previousPromise, nextComposee) => {
            await previousPromise;

            let clonedComposee = await this.duplicateObject(nextComposee);

            if (clonedComposee) {
                idMappings.push({
                    newId: clonedComposee.identifier,
                    oldId: nextComposee.identifier
                });
                this.composeChild(clonedComposee, clonedParent, clonedComposee !== nextComposee);
            }

            return;
        }, Promise.resolve());

        await allComposeesDuplicated;

        clonedParent = this.rewriteIdentifiers(clonedParent, idMappings);
        this.clones.push(clonedParent);

        return clonedParent;
    }

    /**
     * Update identifiers in a cloned object model (or part of
     * a cloned object model) to reflect new identifiers after
     * duplicating.
     * @private
     */
    rewriteIdentifiers(clonedParent, childIdMappings) {
        for (let { newId, oldId } of childIdMappings) {
            let newIdKeyString = this.openmct.objects.makeKeyString(newId);
            let oldIdKeyString = this.openmct.objects.makeKeyString(oldId);

            // regex replace keystrings
            clonedParent = JSON.stringify(clonedParent).replace(new RegExp(oldIdKeyString, 'g'), newIdKeyString);

            // parse reviver to replace identifiers
            clonedParent = JSON.parse(clonedParent, (key, value) => {
                if (Object.prototype.hasOwnProperty.call(value, 'key')
                    && Object.prototype.hasOwnProperty.call(value, 'namespace')
                    && value.key === oldId.key
                    && value.namespace === oldId.namespace) {
                    return newId;
                } else {
                    return value;
                }
            });
        }

        return clonedParent;
    }

    composeChild(child, parent, setLocation) {
        parent.composition.push(child.identifier);

        //If a location is not specified, set it.
        if (setLocation && child.location === undefined) {
            let parentKeyString = this.getKeyString(parent);
            child.location = parentKeyString;
        }
    }

    getTypeDefinition(domainObject, definition) {
        let typeDefinitions = this.openmct.types.get(domainObject.type).definition;

        return typeDefinitions[definition] || false;
    }

    cloneObjectModel(domainObject) {
        let clone = JSON.parse(JSON.stringify(domainObject));
        let identifier = {
            key: uuid(),
            namespace: this.namespace // set to NEW parent's namespace
        };

        if (clone.modified || clone.persisted || clone.location) {
            clone.modified = undefined;
            clone.persisted = undefined;
            clone.location = undefined;
            delete clone.modified;
            delete clone.persisted;
            delete clone.location;
        }

        if (clone.composition) {
            clone.composition = [];
        }

        clone.identifier = identifier;

        return clone;
    }

    getKeyString(domainObject) {
        return this.openmct.objects.makeKeyString(domainObject.identifier);
    }

    isCreatable(domainObject) {
        return this.getTypeDefinition(domainObject, 'creatable');
    }
}
