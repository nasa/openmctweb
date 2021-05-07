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
    ["./SaveAction"],
    function (SaveAction) {

        /**
         * The "Save and Stop Editing" action performs a [Save action]{@link SaveAction}
         * on the object under edit followed by exiting the edit user interface.
         * @constructor
         * @implements {Action}
         * @memberof platform/commonUI/edit
         */
        function SaveAndStopEditingAction(
            dialogService,
            notificationService,
            context
        ) {
            this.context = context;
            this.domainObject = (context || {}).domainObject;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
        }

        /**
         * Trigger a save operation and exit edit mode.
         *
         * @returns {Promise} a promise that will be fulfilled when
         *          cancellation has completed
         * @memberof platform/commonUI/edit.SaveAndStopEditingAction#
         */
        SaveAndStopEditingAction.prototype.perform = function () {
            var domainObject = this.domainObject,
                saveAction = new SaveAction(this.dialogService, this.notificationService, this.context);

            function closeEditor() {
                return domainObject.getCapability("editor").finish();
            }

            return saveAction.perform()
                .then(closeEditor)
                .catch(closeEditor);
        };

        /**
         * Check if this action is applicable in a given context.
         * This will ensure that a domain object is present in the context,
         * and that this domain object is in Edit mode.
         * @returns true if applicable
         */
        SaveAndStopEditingAction.appliesTo = SaveAction.appliesTo;

        return SaveAndStopEditingAction;
    }
);
