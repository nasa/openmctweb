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

define(['lodash'], function (_) {

    /**
     * The ExportAsJSONAction is available from context menus and allows a user
     * to export any creatable domain object as a JSON file.
     *
     * @implements {Action}
     * @constructor
     * @memberof platform/import-export
     */
    function ExportAsJSONAction(
        openmct,
        exportService,
        policyService,
        identifierService,
        typeService,
        context
    ) {
        this.openmct = openmct;
        this.root = {};
        this.tree = {};
        this.calls = 0;
        this.context = context;
        this.externalIdentifiers = [];
        this.exportService = exportService;
        this.policyService = policyService;
        this.identifierService = identifierService;
        this.typeService = typeService;

        this.idMap = {};
    }

    ExportAsJSONAction.prototype.perform = function () {
        var root = this.context.domainObject.useCapability('adapter');
        this.root = this.copyObject(root);
        var rootId = this.getId(this.root);
        this.tree[rootId] = this.root;

        this.saveAs = function (completedTree) {
            this.exportService.exportJSON(
                completedTree,
                {filename: this.root.name + '.json'}
            );
        };

        this.write(this.root);
    };

    /**
     * Traverses object hierarchy and populates tree object with models and
     * identifiers.
     *
     * @private
     * @param {Object} parent
     */
    ExportAsJSONAction.prototype.write = function (parent) {
        this.calls++;
        var composition = this.openmct.composition.get(parent);

        if (composition !== undefined) {
            composition.load()
                .then(function (children) {
                    children.forEach(function (child, index) {
                        // Only export if object is creatable
                        if (this.isCreatable(child)) {
                            // Prevents infinite export of self-contained objs
                            if (!Object.prototype.hasOwnProperty.call(this.tree, this.getId(child))) {
                                // If object is a link to something absent from
                                // tree, generate new id and treat as new object
                                if (this.isExternal(child, parent)) {
                                    child = this.rewriteLink(child, parent);
                                } else {
                                    this.tree[this.getId(child)] = child;
                                }

                                this.write(child);
                            }
                        }
                    }.bind(this));
                    this.calls--;
                    if (this.calls === 0) {
                        this.rewriteReferences();
                        this.saveAs(this.wrapTree());
                    }
                }.bind(this));
        } else {
            this.calls--;
            if (this.calls === 0) {
                this.rewriteReferences();
                this.saveAs(this.wrapTree());
            }
        }
    };

    /**
     * Exports an externally linked object as an entirely new object in the
     * case where the original is not present in the exported tree.
     *
     * @private
     */
    ExportAsJSONAction.prototype.rewriteLink = function (child, parent) {
        this.externalIdentifiers.push(this.getId(child));
        var index = parent.composition.findIndex(id => {
            return _.isEqual(child.identifier, id);
        });
        var copyOfChild = this.copyObject(child);
        copyOfChild.identifier.key = this.identifierService.generate();
        var newIdString = this.getId(copyOfChild);
        var parentId = this.getId(parent);

        this.idMap[this.getId(child)] = newIdString;
        copyOfChild.location = parentId;
        parent.composition[index] = copyOfChild.identifier;
        this.tree[newIdString] = copyOfChild;
        this.tree[parentId].composition[index] = copyOfChild.identifier;

        return copyOfChild;
    };

    ExportAsJSONAction.prototype.copyObject = function (object) {
        var jsonString = JSON.stringify(object);

        return JSON.parse(jsonString);
    };

    ExportAsJSONAction.prototype.isExternal = function (child, parent) {
        if (child.location !== this.getId(parent)
            && !Object.keys(this.tree).includes(child.location)
            && this.getId(child) !== this.getId(this.root)
            || this.externalIdentifiers.includes(this.getId(child))) {

            return true;
        }

        return false;
    };

    /**
     * Wraps root object for identification on reimport and wraps entire
     * exported JSON construct for validation.
     *
     * @private
     */
    ExportAsJSONAction.prototype.wrapTree = function () {
        return {
            "openmct": this.tree,
            "rootId": this.getId(this.root)
        };
    };

    ExportAsJSONAction.prototype.isCreatable = function (domainObject) {
        var type = this.typeService.getType(domainObject.type);

        return this.policyService.allow(
            "creation",
            type
        );
    };

    /**
     * @private
     */
    ExportAsJSONAction.prototype.getId = function (domainObject) {
        return this.openmct.objects.makeKeyString(domainObject.identifier);
    };

    /**
     * @private
     */
    ExportAsJSONAction.prototype.rewriteReferences = function () {
        var treeString = JSON.stringify(this.tree);
        Object.keys(this.idMap).forEach(function (oldId) {
            var newId = this.idMap[oldId];
            treeString = treeString.split(oldId).join(newId);
        }.bind(this));
        this.tree = JSON.parse(treeString);
    };

    return ExportAsJSONAction;
});
