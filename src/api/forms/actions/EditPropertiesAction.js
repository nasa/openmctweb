/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import PropertiesAction from './PropertiesAction';
import CreateWizard from '../CreateWizard';
export default class EditPropertiesAction extends PropertiesAction {
    constructor(openmct) {
        super(openmct);

        this.name = 'Edit Properties...';
        this.key = 'properties';
        this.description = 'Edit properties of this object.';
        this.cssClass = 'major icon-pencil';
        this.hideInDefaultMenu = true;
        this.group = 'action';
        this.priority = 10;
        this.formProperties = {}
    }

    appliesTo(objectPath) {
        const definition = this._getTypeDefinition(objectPath[0].type);

        return definition && definition.creatable;
    }

    invoke(objectPath) {
        this._showEditForm(objectPath);
    }

    // Private methods

    async _onSave(domainObject, changes, parentDomainObject) {
        Object.entries(changes).forEach(([key, value]) => {
            const properties = key.split('.');
            let object = this.domainObject;
            const propertiesLength = properties.length;
            properties.forEach((property, index) => {
                const isComplexProperty = propertiesLength > 1 && index != propertiesLength - 1;
                if (isComplexProperty && object[property] !== null) {
                    object = object[property];
                } else {
                    object[property] = value;
                }
            });

            object = value;
        });

        this.domainObject.modified = Date.now();

        // Show saving progress dialog
        let dialog = this.openmct.overlays.progressDialog({
            progressPerc: 'unknown',
            message: 'Do not navigate away from this page or close this browser tab while this message is displayed.',
            iconClass: 'info',
            title: 'Saving'
        });

        const success = await this.openmct.objects.save(this.domainObject);
        if (success) {
            this.openmct.notifications.info('Save successful');
        } else {
            this.openmct.notifications.error('Error saving objects');
            console.error(error);
        }

        dialog.dismiss();
    }

    _showEditForm(objectPath) {
        this.domainObject = objectPath[0];

        const createWizard = new CreateWizard(this.openmct, this.domainObject, objectPath[1]);
        const formStructure = createWizard.getFormStructure(false);
        formStructure.title = 'Edit ' + this.domainObject.name;

        const options = {
            domainObject: this.domainObject,
            onSave: this._onSave.bind(this)
        };

        this.openmct.forms.showForm(formStructure, options);
    }
}
