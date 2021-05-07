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
define(['zepto', 'objectUtils'], function ($, objectUtils) {

    /**
     * The ImportAsJSONAction is available from context menus and allows a user
     * to import a previously exported domain object into any domain object
     * that has the composition capability.
     *
     * @implements {Action}
     * @constructor
     * @memberof platform/import-export
     */
    function ImportAsJSONAction(
        exportService,
        identifierService,
        dialogService,
        openmct,
        context
    ) {

        this.openmct = openmct;
        this.context = context;
        this.exportService = exportService;
        this.dialogService = dialogService;
        this.identifierService = identifierService;
        this.instantiate = openmct.$injector.get("instantiate");
    }

    ImportAsJSONAction.prototype.perform = function () {
        this.dialogService.getUserInput(this.getFormModel(), {})
            .then(function (form) {
                var objectTree = form.selectFile.body;
                if (this.validateJSON(objectTree)) {
                    this.importObjectTree(JSON.parse(objectTree));
                } else {
                    this.displayError();
                }
            }.bind(this));
    };

    ImportAsJSONAction.prototype.importObjectTree = function (objTree) {
        var parent = this.context.domainObject;
        var namespace = parent.useCapability('adapter').identifier.namespace;

        var tree = this.generateNewIdentifiers(objTree, namespace);
        var rootId = tree.rootId;

        var rootModel = tree.openmct[rootId];
        delete rootModel.persisted;

        var rootObj = this.instantiate(rootModel, rootId);
        var newStyleParent = parent.useCapability('adapter');
        var newStyleRootObj = rootObj.useCapability('adapter');

        if (this.openmct.composition.checkPolicy(newStyleParent, newStyleRootObj)) {
            // Instantiate all objects in tree with their newly generated ids,
            // adding each to its rightful parent's composition
            rootObj.getCapability("location").setPrimaryLocation(parent.getId());
            this.deepInstantiate(rootObj, tree.openmct, []);
            parent.getCapability("composition").add(rootObj);
        } else {
            var dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: "We're sorry, but you cannot import that object type into this object.",
                buttons: [
                    {
                        label: "Ok",
                        emphasis: true,
                        callback: function () {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        }
    };

    ImportAsJSONAction.prototype.deepInstantiate = function (parent, tree, seen) {
        // Traverses object tree, instantiates all domain object w/ new IDs and
        // adds to parent's composition
        if (parent.hasCapability("composition")) {
            var parentModel = parent.getModel();
            var newObj;

            seen.push(parent.getId());

            parentModel.composition.forEach(function (childId) {
                let keystring = this.openmct.objects.makeKeyString(childId);

                if (!tree[keystring] || seen.includes(keystring)) {
                    return;
                }

                let newModel = tree[keystring];
                delete newModel.persisted;

                newObj = this.instantiate(newModel, keystring);
                newObj.getCapability("location")
                    .setPrimaryLocation(tree[keystring].location);
                this.deepInstantiate(newObj, tree, seen);
            }, this);
        }
    };

    ImportAsJSONAction.prototype.generateNewIdentifiers = function (tree, namespace) {
        // For each domain object in the file, generate new ID, replace in tree
        Object.keys(tree.openmct).forEach(function (domainObjectId) {
            let newId = {
                namespace: namespace,
                key: this.identifierService.generate()
            };

            let oldId = objectUtils.parseKeyString(domainObjectId);

            tree = this.rewriteId(oldId, newId, tree);
        }, this);

        return tree;
    };

    ImportAsJSONAction.prototype.getKeyString = function (identifier) {
        return this.openmct.objects.makeKeyString(identifier);
    };

    /**
     * Rewrites all instances of a given id in the tree with a newly generated
     * replacement to prevent collision.
     *
     * @private
     */
    ImportAsJSONAction.prototype.rewriteId = function (oldId, newId, tree) {
        let newIdKeyString = this.openmct.objects.makeKeyString(newId);
        let oldIdKeyString = this.openmct.objects.makeKeyString(oldId);
        tree = JSON.stringify(tree).replace(new RegExp(oldIdKeyString, 'g'), newIdKeyString);

        return JSON.parse(tree, (key, value) => {
            if (value !== undefined
                && value !== null
                && Object.prototype.hasOwnProperty.call(value, 'key')
                && Object.prototype.hasOwnProperty.call(value, 'namespace')
                && value.key === oldId.key
                && value.namespace === oldId.namespace) {
                return newId;
            } else {
                return value;
            }
        });
    };

    ImportAsJSONAction.prototype.getFormModel = function () {
        return {
            name: "Import as JSON",
            sections: [
                {
                    name: "Import A File",
                    rows: [
                        {
                            name: 'Select File',
                            key: 'selectFile',
                            control: 'file-input',
                            required: true,
                            text: 'Select File...'
                        }
                    ]
                }
            ]
        };
    };

    ImportAsJSONAction.prototype.validateJSON = function (jsonString) {
        var json;
        try {
            json = JSON.parse(jsonString);
        } catch (e) {
            return false;
        }

        if (!json.openmct || !json.rootId) {
            return false;
        }

        return true;
    };

    ImportAsJSONAction.prototype.displayError = function () {
        var dialog,
            model = {
                title: "Invalid File",
                actionText: "The selected file was either invalid JSON or was "
                + "not formatted properly for import into Open MCT.",
                severity: "error",
                options: [
                    {
                        label: "Ok",
                        callback: function () {
                            dialog.dismiss();
                        }
                    }
                ]
            };
        dialog = this.dialogService.showBlockingMessage(model);
    };

    ImportAsJSONAction.appliesTo = function (context) {
        let domainObject = context.domainObject;

        if (domainObject && domainObject.model.locked) {
            return false;
        }

        return domainObject !== undefined
            && domainObject.hasCapability("composition");
    };

    return ImportAsJSONAction;
});
