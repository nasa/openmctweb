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

define([
    '../creation/CreateWizard',
    './SaveInProgressDialog'
],
function (
    CreateWizard,
    SaveInProgressDialog
) {

    /**
         * The "Save" action; the action triggered by clicking Save from
         * Edit Mode. Exits the editing user interface and invokes object
         * capabilities to persist the changes that have been made.
         * @constructor
         * @implements {Action}
         * @memberof platform/commonUI/edit
         */
    function SaveAsAction(
        $injector,
        dialogService,
        copyService,
        notificationService,
        openmct,
        context
    ) {
        this.domainObject = (context || {}).domainObject;
        this.injectObjectService = function () {
            this.objectService = $injector.get("objectService");
        };

        this.dialogService = dialogService;
        this.copyService = copyService;
        this.notificationService = notificationService;
        this.openmct = openmct;
    }

    /**
         * @private
         */
    SaveAsAction.prototype.createWizard = function (parent) {
        return new CreateWizard(
            this.domainObject,
            parent,
            this.openmct
        );
    };

    /**
         * @private
         */
    SaveAsAction.prototype.getObjectService = function () {
        // Lazily acquire object service (avoids cyclical dependency)
        if (!this.objectService) {
            this.injectObjectService();
        }

        return this.objectService;
    };

    /**
         * Save changes and conclude editing.
         *
         * @returns {Promise} a promise that will be fulfilled when
         *          cancellation has completed
         * @memberof platform/commonUI/edit.SaveAction#
         */
    SaveAsAction.prototype.perform = function () {
        return this.save();
    };

    /**
         * @private
         */
    SaveAsAction.prototype.save = function () {
        var self = this,
            domainObject = this.domainObject,
            dialog = new SaveInProgressDialog(this.dialogService),
            toUndirty = [];

        function doWizardSave(parent) {
            var wizard = self.createWizard(parent);

            return self.dialogService
                .getUserInput(wizard.getFormStructure(true),
                    wizard.getInitialFormValue())
                .then(wizard.populateObjectFromInput.bind(wizard), function (failureReason) {
                    return Promise.reject("user canceled");
                });
        }

        function showBlockingDialog(object) {
            dialog.show();

            return object;
        }

        function hideBlockingDialog(object) {
            dialog.hide();

            return object;
        }

        function fetchObject(objectId) {
            return self.getObjectService().getObjects([objectId]).then(function (objects) {
                return objects[objectId];
            });
        }

        function getParent(object) {
            return fetchObject(object.getModel().location);
        }

        function saveObject(parent) {
            return self.openmct.editor.save().then(() => {
                // Force mutation for search indexing
                return parent;
            });
        }

        function addSavedObjectToParent(parent) {
            return parent.getCapability("composition")
                .add(domainObject)
                .then(function (addedObject) {
                    return parent.getCapability("persistence").persist()
                        .then(function () {
                            return addedObject;
                        });
                });
        }

        function undirty(object) {
            return object.getCapability('persistence').refresh();
        }

        function undirtyOriginals(object) {
            return Promise.all(toUndirty.map(undirty))
                .then(() => {
                    return object;
                });
        }

        function indexForSearch(addedObject) {
            addedObject.useCapability('mutation', (model) => {
                return model;
            });

            return addedObject;
        }

        function onSuccess(object) {
            self.notificationService.info("Save Succeeded");

            return object;
        }

        function onFailure(reason) {
            hideBlockingDialog();
            if (reason !== "user canceled") {
                self.notificationService.error("Save Failed");
            }

            throw reason;
        }

        return getParent(domainObject)
            .then(doWizardSave)
            .then(showBlockingDialog)
            .then(getParent)
            .then(saveObject)
            .then(addSavedObjectToParent)
            .then(undirtyOriginals)
            .then((addedObject) => {
                return fetchObject(addedObject.getId());
            })
            .then(indexForSearch)
            .then(hideBlockingDialog)
            .then(onSuccess)
            .catch(onFailure);
    };

    /**
         * Check if this action is applicable in a given context.
         * This will ensure that a domain object is present in the context,
         * and that this domain object is in Edit mode.
         * @returns true if applicable
         */
    SaveAsAction.appliesTo = function (context) {
        var domainObject = (context || {}).domainObject;

        return domainObject !== undefined
                && domainObject.hasCapability('editor')
                && domainObject.getCapability('editor').isEditContextRoot()
                && domainObject.getModel().persisted === undefined;
    };

    return SaveAsAction;
}
);
