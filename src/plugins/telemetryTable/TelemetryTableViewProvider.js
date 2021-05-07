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

define([
    './components/table.vue',
    './TelemetryTable',
    'vue'
], function (
    TableComponent,
    TelemetryTable,
    Vue
) {
    function TelemetryTableViewProvider(openmct) {
        function hasTelemetry(domainObject) {
            if (!Object.prototype.hasOwnProperty.call(domainObject, 'telemetry')) {
                return false;
            }

            let metadata = openmct.telemetry.getMetadata(domainObject);

            return metadata.values().length > 0;
        }

        return {
            key: 'table',
            name: 'Telemetry Table',
            cssClass: 'icon-tabular-realtime',
            canView(domainObject) {
                return domainObject.type === 'table'
                    || hasTelemetry(domainObject);
            },
            canEdit(domainObject) {
                return domainObject.type === 'table';
            },
            view(domainObject, objectPath) {
                let table = new TelemetryTable(domainObject, openmct);
                let component;
                let markingProp = {
                    enable: true,
                    useAlternateControlBar: false,
                    rowName: '',
                    rowNamePlural: ''
                };
                const view = {
                    show: function (element, editMode) {
                        component = new Vue({
                            el: element,
                            components: {
                                TableComponent: TableComponent.default
                            },
                            provide: {
                                openmct,
                                table,
                                objectPath
                            },
                            data() {
                                return {
                                    isEditing: editMode,
                                    markingProp,
                                    view
                                };
                            },
                            template: '<table-component ref="tableComponent" :isEditing="isEditing" :marking="markingProp" :view="view"/>'
                        });
                    },
                    onEditModeChange(editMode) {
                        component.isEditing = editMode;
                    },
                    onClearData() {
                        table.clearData();
                    },
                    getViewContext() {
                        if (component) {
                            return component.$refs.tableComponent.getViewContext();
                        } else {
                            return {
                                type: 'telemetry-table'
                            };
                        }
                    },
                    destroy: function (element) {
                        component.$destroy();
                        component = undefined;
                    },
                    _getTable: function () {
                        return table;
                    }
                };

                return view;
            },
            priority() {
                return 1;
            }
        };
    }

    return TelemetryTableViewProvider;
});
