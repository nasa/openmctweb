/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    '../../api/objects/object-utils',
    './components/table-configuration.vue',
    './TelemetryTableConfiguration',
    'vue'
], function (
    objectUtils,
    TableConfigurationComponent,
    TelemetryTableConfiguration,
    Vue
) {

    function TableConfigurationViewProvider(openmct) {
        return {
            key: 'table-configuration',
            name: 'Telemetry Table Configuration',
            canView: function (selection) {
                if (selection.length === 0) {
                    return false;
                }
                let object = selection[selection.length - 1].context.item;
                return object.type === 'table' &&
                    openmct.editor.isEditing();
            },
            view: function (selection) {
                let component;
                let domainObject = selection[selection.length - 1].context.item;
                const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);
                let parentElement;
                return {
                    show: function (element) {
                        parentElement = element;
                        component = new Vue({
                            provide: {
                                openmct,
                                tableConfiguration
                            },
                            components: {
                                TableConfiguration: TableConfigurationComponent.default
                            },
                            template: '<table-configuration></table-configuration>'
                        });
                        element.appendChild(component.$mount().$el);
                    },
                    destroy: function () {
                        component.$destroy();
                        parentElement.removeChild(component.$el);
                        component = undefined;

                    }
                }
            },
            priority: function () {
                return 1;
            }
        }
    }
    return TableConfigurationViewProvider;
});
