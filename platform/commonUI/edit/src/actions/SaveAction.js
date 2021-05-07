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
    ['./SaveInProgressDialog'],
    function (SaveInProgressDialog) {

        /**
         * The "Save" action; it invokes object capabilities to persist
         * the changes that have been made.
         * @constructor
         * @implements {Action}
         * @memberof platform/commonUI/edit
         */
        function SaveAction(
            dialogService,
            notificationService,
            context
        ) {
            this.domainObject = (context || {}).domainObject;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
        }

        /**
         * Save changes.
         *
         * @returns {Promise} a promise that will be fulfilled when
         *          cancellation has completed
         * @memberof platform/commonUI/edit.SaveAction#
         */
        SaveAction.prototype.perform = function () {
            var self = this,
                domainObject = this.domainObject,
                dialog = new SaveInProgressDialog(this.dialogService);

            // Invoke any save behavior introduced by the editor capability;
            // this is introduced by EditableDomainObject which is
            // used to insulate underlying objects from changes made
            // during editing.
            function doSave() {
                return domainObject.getCapability("editor").save();
            }

            function onSuccess() {
                dialog.hide();
                self.notificationService.info("Save Succeeded");
            }

            function onFailure() {
                dialog.hide();
                self.notificationService.error("Save Failed");
            }

            dialog.show();

            return doSave()
                .then(onSuccess)
                .catch(onFailure);
        };

        /**
         * Check if this action is applicable in a given context.
         * This will ensure that a domain object is present in the context,
         * and that this domain object is in Edit mode.
         * @returns true if applicable
         */
        SaveAction.appliesTo = function (context) {
            var domainObject = (context || {}).domainObject;

            return domainObject !== undefined
                && domainObject.hasCapability('editor')
                && domainObject.getCapability('editor').isEditContextRoot()
                && domainObject.getModel().persisted !== undefined;
        };

        return SaveAction;
    }
);
