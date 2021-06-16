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

import uuid from 'uuid';

export default class CreateAction extends PropertiesAction {
    constructor(openmct, type, parentDomainObject) {
        super(openmct);

        this.type = type;
        this.parentDomainObject = parentDomainObject;
    }

    invoke() {
        this._showCreateForm(this.type);
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
        this.domainObject.location = this.openmct.objects.makeKeyString(parentDomainObject.identifier);
        this.domainObject.identifier.namespace = parentDomainObject.identifier.namespace;

        // Show saving progress dialog
        let dialog = this.openmct.overlays.progressDialog({
            progressPerc: 'unknown',
            message: 'Do not navigate away from this page or close this browser tab while this message is displayed.',
            iconClass: 'info',
            title: 'Saving'
        });

        const success = await this.openmct.objects.save(this.domainObject);
        if (success) {
            const compositionCollection = await openmct.composition.get(parentDomainObject);
            compositionCollection.add(this.domainObject);

            this._navigateAndEdit(this.domainObject);

            this.openmct.notifications.info('Save successful');
        } else {
            this.openmct.notifications.error('Error saving objects');
            console.error(error);
        }
        dialog.dismiss();
    }

    async _navigateAndEdit(domainObject) {
        const objectPath = await this.openmct.objects.getOriginalPath(domainObject.identifier);

        const url = '#/browse/' + objectPath
            .map(object => object && this.openmct.objects.makeKeyString(object.identifier.key))
            .reverse()
            .join('/');

        window.location.href = url;

        const objectView = openmct.objectViews.get(domainObject, objectPath)[0];
        const canEdit = objectView && objectView.canEdit && objectView.canEdit(domainObject, objectPath);
        if (canEdit) {
            openmct.editor.edit();
        }
    }

    _showCreateForm(type) {
        const typeDefinition = this.openmct.types.get(type);
        const definition = typeDefinition.definition;
        const domainObject = {
            name: `Unnamed ${definition.name}`,
            type,
            identifier: {
                key: uuid(),
                namespace: this.parentDomainObject.identifier.namespace
            }
        };

        this.domainObject = domainObject;

        if (definition.initialize) {
            definition.initialize(domainObject);
        }

        const createWizard = new CreateWizard(this.openmct, domainObject, this.parentDomainObject);
        const formStructure = createWizard.getFormStructure(true);
        formStructure.title = 'Create a New ' + definition.name;

        const options = {
            domainObject,
            onSave: this._onSave.bind(this)
        };

        this.openmct.forms.showForm(formStructure, options);
    }
}
