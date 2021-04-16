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
 * A class for capturing user input data from an object creation
 * dialog, and populating a domain object with that data.
 *
 * @param {DomainObject} domainObject the newly created object to
 * populate with user input
 * @param {DomainObject} parent the domain object to serve as
 *        the initial parent for the created object, in the dialog
 * @memberof platform/commonUI/browse
 * @constructor
 */
export default class CreateWizard {

    constructor(domainObject, parent, openmct) {
        this.type = openmct.types.get(domainObject.type);
        this.model = domainObject;
        this.domainObject = domainObject;
        this.properties = this.type.definition.form || [];
        this.parent = parent;
        this.openmct = openmct;
    }

    /**
     * Get the form model for this wizard; this is a description
     * that will be rendered to an HTML form. See the
     * platform/forms bundle
     * @param {boolean} includeLocation if true, a 'location' section
     * will be included that will allow the user to select the location
     * of the newly created object, otherwise the .location property of
     * the model will be used.
     * @return {FormModel} formModel the form model to
     *         show in the create dialog
     */
    getFormStructure(includeLocation) {
        let sections = [];
        let domainObject = this.domainObject;
        let self = this;

        function validateLocation(parent) {
            return parent && self.openmct.composition.checkPolicy(parent.useCapability('adapter'), domainObject.useCapability('adapter'));
        }

        sections.push({
            name: "Properties",
            rows: this.properties.map(function (property, index) {
                // Property definition is same as form row definition
                let row = JSON.parse(JSON.stringify(property));

                // Use index as the key into the formValue;
                // this correlates to the indexing provided by
                // getInitialFormValue
                row.key = index;

                return row;
            }).filter(function (row) {
                // Only show rows which have defined controls
                return row && row.control;
            })
        });

        // Ensure there is always a "save in" section
        if (includeLocation) {
            sections.push({
                name: 'Location',
                cssClass: "grows",
                rows: [{
                    name: "Save In",
                    control: "locator",
                    validate: validateLocation.bind(this),
                    key: "createParent"
                }]
            });
        }

        return {
            sections: sections,
            name: "Create a New " + this.type.definition.name
        };
    }

    /**
     * Given some form input values and a domain object, populate the
     * domain object used to create this wizard from the given form values.
     * @param formValue
     * @returns {DomainObject}
     */
    populateObjectFromInput(formValue) {
        let parent = this.getLocation(formValue);
        let formModel = this.createModel(formValue);

        formModel.location = parent.getId();

        this.updateNamespaceFromParent(parent);

        this.domainObject.useCapability("mutation", function () {
            return formModel;
        });

        return this.domainObject;
    }

    updateNamespaceFromParent(parent) {
        let childIdentifier = this.domainObject.useCapability('adapter').identifier;
        let parentIdentifier = parent.useCapability('adapter').identifier;
        childIdentifier.namespace = parentIdentifier.namespace;
        this.domainObject.id = this.openmct.objects.makeKeyString(childIdentifier);
    }

    /**
     * Get the initial value for the form being described.
     * This will include the values for all properties described
     * in the structure.
     *
     * @returns {object} the initial value of the form
     */
    getInitialFormValue() {
        // Start with initial values for properties
        let model = this.model;
        let formValue = this.properties.map(function (property) {
            return property.getValue(model);
        });

        // Include the createParent
        formValue.createParent = this.parent;

        return formValue;
    }

    /**
     * Based on a populated form, get the domain object which
     * should be used as a parent for the newly-created object.
     * @private
     * @return {DomainObject}
     */
    getLocation(formValue) {
        return formValue.createParent || this.parent;
    }

    /**
     * Create the domain object model for a newly-created object,
     * based on user input read from a formModel.
     * @private
     * @return {object} the domain object model
     */
    createModel(formValue) {
        // Clone
        let newModel = JSON.parse(JSON.stringify(this.domainObject));

        // Update all properties
        this.properties.forEach(function (property, index) {
            property.setValue(newModel, formValue[index]);
        });

        return newModel;
    }
}
