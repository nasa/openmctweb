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
         * Controller for the `dialog-button` control type. Provides
         * structure for a button (embedded via the template) which
         * will show a dialog for editing a single property when clicked.
         * @memberof platform/forms
         * @constructor
         * @param $scope the control's Angular scope
         * @param {DialogService} dialogService service to use to prompt
         *        for user input
         */
        function DialogButtonController($scope, dialogService) {
            var self = this,
                buttonForm;

            // Store the result of user input to the model
            function storeResult(result) {
                $scope.ngModel[$scope.field] = result[$scope.field];
            }

            // Prompt for user input
            function showDialog() {
                // Prepare initial state
                var state = {};
                state[$scope.field] = $scope.ngModel[$scope.field];

                // Show dialog, then store user input (if any)
                dialogService.getUserInput(buttonForm, state).then(storeResult);
            }

            // Refresh state based on structure for this control
            function refreshStructure(structure) {
                var row = Object.create(structure.dialog || {});

                structure = structure || {};

                // Add the key, to read back from that row
                row.key = $scope.field;

                // Prepare the structure for the button itself
                self.buttonStructure = {};
                self.buttonStructure.cssClass = structure.cssClass;
                self.buttonStructure.name = structure.name;
                self.buttonStructure.description = structure.description;
                self.buttonStructure.click = showDialog;

                // Prepare the form; a single row
                buttonForm = {
                    name: structure.title,
                    sections: [{ rows: [row] }]
                };
            }

            $scope.$watch('structure', refreshStructure);
        }

        /**
         * Get the structure for an `mct-control` of type
         * `button`; a dialog will be launched when this button
         * is clicked.
         * @returns dialog structure
         */
        DialogButtonController.prototype.getButtonStructure = function () {
            return this.buttonStructure;
        };

        return DialogButtonController;
    }
);
