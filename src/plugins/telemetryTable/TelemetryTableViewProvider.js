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
import TableComponent from './components/table.vue';
import TelemetryTable from './TelemetryTable';
import Vue from 'vue';

class TelemetryTableView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;

        this.table = new TelemetryTable(domainObject, openmct);
    }

    getViewContext() {
        if (this.component) {
            return this.component.$refs.tableComponent.getViewContext();
        } else {
            return {
                type: 'telemetry-table'
            };
        }
    }

    onEditModeChange(editMode) {
        this.component.isEditing = editMode;
    }

    onClearData() {
        this.table.clearData();
    }

    getTable() {
        return this.table;
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }

    show(element, editMode) {
        this.component = new Vue({
            el: element,
            components: {
                TableComponent
            },
            provide: {
                openmct: this.openmct,
                objectPath: this.objectPath,
                table: this.table,
                currentView: this
            },
            data() {
                return {
                    isEditing: editMode,
                    marking: {
                        disableMultiSelect: false,
                        enable: true,
                        rowName: '',
                        rowNamePlural: '',
                        useAlternateControlBar: false
                    }
                };
            },
            template: '<table-component ref="tableComponent" :is-editing="isEditing" :marking="marking"></table-component>'
        });
    }
}

export default function TelemetryTableViewProvider(openmct) {
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
            return new TelemetryTableView(openmct, domainObject, objectPath);
        },
        priority() {
            return 1;
        }
    };
}
