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
import EditPropertiesAction from './actions/EditPropertiesAction';
import FormProperties from './components/FormProperties.vue';

import Vue from 'vue';

export const CONTROLS = [
    "autocomplete",
    "button",
    "checkbox",
    "color",
    "composite",
    "datetime",
    "dialog-button",
    "file-input",
    "menu-button",
    "numberfield",
    "radio",
    "select",
    "textarea",
    "textfield"
];

export default class FormsAPI {
    constructor(openmct) {
        this.openmct = openmct;
        this.controls = {};

        this.init();
    }

    addControl(name, actions) {
        const control = this.controls[name];
        if (control) {
           this.openmct.notifications.error(`Error: provided form control '${name}', already exists`);

           return;
        }

        this.controls[name] = actions;
    }

    getAllControls() {
        return this.controls;
    }

    getControl(name) {
        const control = this.controls[name];
        if (control) {
            console.error(`Error: form control '${name}', does not exist`);
        }

        return control;
    }

    showForm(formStructure, options) {
        const changes = {};
        let overlay;

        let parentDomainObject = options.parentDomainObject || {};
        const domainObject = options.domainObject;
        const onSave = () => {
            overlay.dismiss();

            if(options.onSave) {
                options.onSave(domainObject, changes, parentDomainObject);
            }
        };

        const onDismiss = () => {
            overlay.dismiss();

            if (options.onDismiss) {
                options.onDismiss();
            };
        };

        const vm = new Vue({
            components: { FormProperties },
            provide: {
                openmct: this.openmct,
                domainObject
            },
            data() {
                return {
                    formStructure,
                    onChange,
                    onDismiss,
                    onSave
                };
            },
            template: '<FormProperties :model="formStructure" @onChange="onChange" @onDismiss="onDismiss" @onSave="onSave"></FormProperties>'
        }).$mount();

        overlay = this.openmct.overlays.overlay({
            element: vm.$el,
            size: 'small',
            onDestroy: () => vm.$destroy()
        });

        function onChange(data) {
            if (options.onChange) {
                options.onChange(data);
            }

            if (data.model) {
                const property = data.model.property;
                let key = data.model.key;
                if (key === 'location') {
                    parentDomainObject = data.value;
                }

                if (property && property.length) {
                    key = property.join('.');
                }

                changes[key] = data.value;
            }
        }
    }

    // Private methods

    /**
     * @private
     */
    _addDefaultFormControls() {
        CONTROLS.forEach(control => {
            this.addControl(control);
        });
    }

    // Init
    init() {
        this.openmct.actions.register(new EditPropertiesAction(this.openmct));

        this._addDefaultFormControls();
    }
}
