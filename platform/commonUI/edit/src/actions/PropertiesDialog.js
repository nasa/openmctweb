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
    function () {

        /**
         * Construct a new Properties dialog.
         *
         * @param {TypeImpl} type the type of domain object for which properties
         *        will be specified
         * @param {DomainObject} the object for which properties will be set
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function PropertiesDialog(type, model) {
            this.type = type;
            this.model = model;
            this.properties = type.getProperties();
        }

        /**
         * Get sections provided by this dialog.
         * @return {FormStructure} the structure of this form
         */
        PropertiesDialog.prototype.getFormStructure = function () {
            return {
                name: "Edit " + this.model.name,
                sections: [{
                    name: "Properties",
                    rows: this.properties.map(function (property, index) {
                        // Property definition is same as form row definition
                        var row = JSON.parse(JSON.stringify(property.getDefinition()));
                        row.key = index;

                        return row;
                    }).filter(function (row) {
                        // Only show properties which are editable
                        return row.control;
                    })
                }]
            };
        };

        /**
         * Get the initial state of the form shown by this dialog
         * (based on the object model)
         * @returns {object} initial state of the form
         */
        PropertiesDialog.prototype.getInitialFormValue = function () {
            var model = this.model;

            // Start with initial values for properties
            // Note that index needs to correlate to row.key
            // from getFormStructure
            return this.properties.map(function (property) {
                return property.getValue(model);
            });
        };

        /**
         * Update a domain object model based on the value of a form.
         */
        PropertiesDialog.prototype.updateModel = function (model, formValue) {
            // Update all properties
            this.properties.forEach(function (property, index) {
                property.setValue(model, formValue[index]);
            });
        };

        return PropertiesDialog;
    }
);
