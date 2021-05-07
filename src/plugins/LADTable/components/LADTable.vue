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
<div class="c-lad-table-wrapper u-style-receiver js-style-receiver">
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
            <lad-row
                v-for="item in items"
                :key="item.key"
                :domain-object="item.domainObject"
                :object-path="objectPath"
                :has-units="hasUnits"
            />
        </tbody>
    </table>
</div>
</template>

<script>
import LadRow from './LADRow.vue';

export default {
    components: {
        LadRow
    },
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        objectPath: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            items: []
        };
    },
    computed: {
        hasUnits() {
            let itemsWithUnits = this.items.filter((item) => {
                let metadata = this.openmct.telemetry.getMetadata(item.domainObject);

                return this.metadataHasUnits(metadata.valueMetadatas);

            });

            return itemsWithUnits.length !== 0;
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addItem);
        this.composition.on('remove', this.removeItem);
        this.composition.on('reorder', this.reorder);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.reorder);
    },
    methods: {
        addItem(domainObject) {
            let item = {};
            item.domainObject = domainObject;
            item.key = this.openmct.objects.makeKeyString(domainObject.identifier);

            this.items.push(item);
        },
        removeItem(identifier) {
            let index = this.items.findIndex(item => this.openmct.objects.makeKeyString(identifier) === item.key);

            this.items.splice(index, 1);
        },
        reorder(reorderPlan) {
            let oldItems = this.items.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.items, reorderEvent.newIndex, oldItems[reorderEvent.oldIndex]);
            });
        },
        metadataHasUnits(valueMetadatas) {
            let metadataWithUnits = valueMetadatas.filter(metadatum => metadatum.unit);

            return metadataWithUnits.length > 0;
        }
    }
};
</script>
