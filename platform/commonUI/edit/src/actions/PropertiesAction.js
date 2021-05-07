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
 * Edit the properties of a domain object. Shows a dialog
 * which should display a set of properties similar to that
 * shown in the Create wizard.
 */
define(
    ['./PropertiesDialog'],
    function (PropertiesDialog) {

        /**
         * Implements the "Edit Properties" action, which prompts the user
         * to modify a domain object's properties.
         *
         * @param {DialogService} dialogService a service which will show the dialog
         * @param {DomainObject} object the object to be edited
         * @param {ActionContext} context the context in which this action is performed
         * @memberof platform/commonUI/edit
         * @implements {Action}
         * @constructor
         */
        function PropertiesAction(dialogService, context) {
            this.domainObject = (context || {}).domainObject;
            this.dialogService = dialogService;
        }

        PropertiesAction.prototype.perform = function () {
            var type = this.domainObject.getCapability('type'),
                domainObject = this.domainObject,
                dialogService = this.dialogService;

            // Update the domain object model based on user input
            function updateModel(userInput, dialog) {
                return domainObject.useCapability('mutation', function (model) {
                    dialog.updateModel(model, userInput);
                });
            }

            function showDialog(objType) {
                // Create a dialog object to generate the form structure, etc.
                var dialog =
                    new PropertiesDialog(objType, domainObject.getModel());

                // Show the dialog
                return dialogService.getUserInput(
                    dialog.getFormStructure(),
                    dialog.getInitialFormValue()
                ).then(function (userInput) {
                    // Update the model, if user input was provided
                    return userInput && updateModel(userInput, dialog);
                });
            }

            return type && showDialog(type);
        };

        /**
         * Filter this action for applicability against a given context.
         * This will ensure that a domain object is present in the
         * context.
         */
        PropertiesAction.appliesTo = function (context) {

            var domainObject = (context || {}).domainObject,
                type = domainObject && domainObject.getCapability('type'),
                creatable = type && type.hasFeature('creation');

            if (domainObject && domainObject.model && domainObject.model.locked) {
                return false;
            }

            // Only allow creatable types to be edited
            return domainObject && creatable;
        };

        return PropertiesAction;
    }

);

