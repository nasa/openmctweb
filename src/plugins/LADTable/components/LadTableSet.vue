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

<template>
<table class="c-table c-lad-table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Timestamp</th>
            <th>Value</th>
            <th v-if="hasUnits">Unit</th>
        </tr>
    </thead>
    <tbody>
        <template
            v-for="ladTable in ladTableObjects"
        >
            <tr
                :key="ladTable.key"
                class="c-table__group-header js-lad-table-set__table-headers"
            >
                <td colspan="10">
                    {{ ladTable.domainObject.name }}
                </td>
            </tr>
            <lad-row
                v-for="telemetryObject in ladTelemetryObjects[ladTable.key]"
                :key="telemetryObject.key"
                :domain-object="telemetryObject.domainObject"
                :has-units="hasUnits"
            />
        </template>
    </tbody>
</table>
</template>

<script>
import LadRow from './LADRow.vue';

export default {
    components: {
        LadRow
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            ladTableObjects: [],
            ladTelemetryObjects: {},
            compositions: []
        };
    },
    computed: {
        hasUnits() {
            let ladTables = Object.values(this.ladTelemetryObjects);
            for (let ladTable of ladTables) {
                for (let telemetryObject of ladTable) {
                    let metadata = this.openmct.telemetry.getMetadata(telemetryObject.domainObject);
                    for (let metadatum of metadata.valueMetadatas) {
                        if (metadatum.unit) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addLadTable);
        this.composition.on('remove', this.removeLadTable);
        this.composition.on('reorder', this.reorderLadTables);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.addLadTable);
        this.composition.off('remove', this.removeLadTable);
        this.composition.off('reorder', this.reorderLadTables);
        this.compositions.forEach(c => {
            c.composition.off('add', c.addCallback);
            c.composition.off('remove', c.removeCallback);
        });
    },
    methods: {
        addLadTable(domainObject) {
            let ladTable = {};
            ladTable.domainObject = domainObject;
            ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);

            this.$set(this.ladTelemetryObjects, ladTable.key, []);
            this.ladTableObjects.push(ladTable);

            let composition = this.openmct.composition.get(ladTable.domainObject);
            let addCallback = this.addTelemetryObject(ladTable);
            let removeCallback = this.removeTelemetryObject(ladTable);

            composition.on('add', addCallback);
            composition.on('remove', removeCallback);
            composition.load();

            this.compositions.push({
                composition,
                addCallback,
                removeCallback
            });
        },
        removeLadTable(identifier) {
            let index = this.ladTableObjects.findIndex(ladTable => this.openmct.objects.makeKeyString(identifier) === ladTable.key);
            let ladTable = this.ladTableObjects[index];

            this.$delete(this.ladTelemetryObjects, ladTable.key);
            this.ladTableObjects.splice(index, 1);
        },
        reorderLadTables(reorderPlan) {
            let oldComposition = this.ladTableObjects.slice();
            reorderPlan.forEach(reorderEvent => {
                this.$set(this.ladTableObjects, reorderEvent.newIndex, oldComposition[reorderEvent.oldIndex]);
            });
        },
        addTelemetryObject(ladTable) {
            return (domainObject) => {
                let telemetryObject = {};
                telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
                telemetryObject.domainObject = domainObject;

                let telemetryObjects = this.ladTelemetryObjects[ladTable.key];
                telemetryObjects.push(telemetryObject);

                this.$set(this.ladTelemetryObjects, ladTable.key, telemetryObjects);
            };
        },
        removeTelemetryObject(ladTable) {
            return (identifier) => {
                let telemetryObjects = this.ladTelemetryObjects[ladTable.key];
                let index = telemetryObjects.findIndex(telemetryObject => this.openmct.objects.makeKeyString(identifier) === telemetryObject.key);

                telemetryObjects.splice(index, 1);

                this.$set(this.ladTelemetryObjects, ladTable.key, telemetryObjects);
            };
        }
    }
};
</script>
