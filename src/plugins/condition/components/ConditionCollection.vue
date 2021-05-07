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
<section id="conditionCollection"
         :class="{ 'is-expanded': expanded }"
>
    <div class="c-cs__header c-section__header">
        <span
            class="c-disclosure-triangle c-tree__item__view-control is-enabled"
            :class="{ 'c-disclosure-triangle--expanded': expanded }"
            @click="expanded = !expanded"
        ></span>
        <div class="c-cs__header-label c-section__label">Conditions</div>
    </div>
    <div v-if="expanded"
         class="c-cs__content"
    >
        <div v-show="isEditing"
             class="hint"
             :class="{ 's-status-icon-warning-lo': !telemetryObjs.length }"
        >
            <template v-if="!telemetryObjs.length">Drag telemetry into this Condition Set to configure Conditions and add criteria.</template>
            <template v-else>The first condition to match is the one that is applied. Drag conditions to reorder.</template>
        </div>

        <button
            v-show="isEditing"
            id="addCondition"
            class="c-button c-button--major icon-plus labeled"
            @click="addCondition"
        >
            <span class="c-cs-button__label">Add Condition</span>
        </button>

        <div class="c-cs__conditions-h"
             :class="{ 'is-active-dragging': isDragging }"
        >
            <Condition v-for="(condition, index) in conditionCollection"
                       :key="condition.id"
                       :condition="condition"
                       :current-condition-id="currentConditionId"
                       :condition-index="index"
                       :telemetry="telemetryObjs"
                       :is-editing="isEditing"
                       :move-index="moveIndex"
                       :is-dragging="isDragging"
                       @updateCondition="updateCondition"
                       @removeCondition="removeCondition"
                       @cloneCondition="cloneCondition"
                       @setMoveIndex="setMoveIndex"
                       @dragComplete="dragComplete"
                       @dropCondition="dropCondition"
            />
        </div>
    </div>
</section>
</template>

<script>
import Condition from './Condition.vue';
import ConditionManager from '../ConditionManager';

export default {
    components: {
        Condition
    },
    inject: ['openmct', 'domainObject'],
    props: {
        isEditing: Boolean,
        testData: {
            type: Object,
            required: true,
            default: () => {
                return {
                    applied: false,
                    conditionTestInputs: []
                };
            }
        }
    },
    data() {
        return {
            expanded: true,
            conditionCollection: [],
            conditionResults: {},
            conditions: [],
            telemetryObjs: [],
            moveIndex: undefined,
            isDragging: false,
            defaultOutput: undefined,
            dragCounter: 0,
            currentConditionId: ''
        };
    },
    watch: {
        defaultOutput(newOutput, oldOutput) {
            this.$emit('updateDefaultOutput', newOutput);
        },
        testData: {
            handler() {
                this.updateTestData();
            },
            deep: true
        }
    },
    destroyed() {
        this.composition.off('add', this.addTelemetryObject);
        this.composition.off('remove', this.removeTelemetryObject);
        if (this.conditionManager) {
            this.conditionManager.off('conditionSetResultUpdated', this.handleConditionSetResultUpdated);
            this.conditionManager.destroy();
        }

        if (this.stopObservingForChanges) {
            this.stopObservingForChanges();
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetryObject);
        this.composition.on('remove', this.removeTelemetryObject);
        this.composition.load();
        this.conditionCollection = this.domainObject.configuration.conditionCollection;
        this.observeForChanges();
        this.conditionManager = new ConditionManager(this.domainObject, this.openmct);
        this.conditionManager.on('conditionSetResultUpdated', this.handleConditionSetResultUpdated);
        this.updateDefaultCondition();
    },
    methods: {
        handleConditionSetResultUpdated(data) {
            this.currentConditionId = data.conditionId;
            this.$emit('conditionSetResultUpdated', data);
        },
        observeForChanges() {
            this.stopObservingForChanges = this.openmct.objects.observe(this.domainObject, 'configuration.conditionCollection', (newConditionCollection) => {
                //this forces children to re-render
                this.conditionCollection = newConditionCollection.map(condition => condition);
                this.updateDefaultCondition();
            });
        },
        updateDefaultCondition() {
            const defaultCondition = this.domainObject.configuration.conditionCollection
                .find(conditionConfiguration => conditionConfiguration.isDefault);
            this.defaultOutput = defaultCondition.configuration.output;
        },
        setMoveIndex(index) {
            this.moveIndex = index;
            this.isDragging = true;
        },
        dropCondition(targetIndex) {
            const oldIndexArr = Object.keys(this.conditionCollection);
            const newIndexArr = this.rearrangeIndices(oldIndexArr, this.moveIndex, targetIndex);
            const reorderPlan = [];

            for (let i = 0; i < oldIndexArr.length; i++) {
                reorderPlan.push({
                    oldIndex: Number(newIndexArr[i]),
                    newIndex: i
                });
            }

            this.reorder(reorderPlan);
        },
        dragComplete() {
            this.isDragging = false;
        },
        rearrangeIndices(arr, old_index, new_index) {
            while (old_index < 0) {
                old_index += arr.length;
            }

            while (new_index < 0) {
                new_index += arr.length;
            }

            if (new_index >= arr.length) {
                let k = new_index - arr.length;
                while ((k--) + 1) {
                    arr.push(undefined);
                }
            }

            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);

            return arr;
        },
        addTelemetryObject(domainObject) {
            this.telemetryObjs.push(domainObject);
            this.$emit('telemetryUpdated', this.telemetryObjs);
        },
        removeTelemetryObject(identifier) {
            let index = this.telemetryObjs.findIndex(obj => {
                let objId = this.openmct.objects.makeKeyString(obj.identifier);
                let id = this.openmct.objects.makeKeyString(identifier);

                return objId === id;
            });
            if (index > -1) {
                this.telemetryObjs.splice(index, 1);
            }
        },
        addCondition() {
            this.conditionManager.addCondition();
        },
        updateCondition(data) {
            this.conditionManager.updateCondition(data.condition);
        },
        removeCondition(id) {
            this.conditionManager.removeCondition(id);
        },
        reorder(reorderPlan) {
            this.conditionManager.reorderConditions(reorderPlan);
        },
        cloneCondition(data) {
            this.conditionManager.cloneCondition(data.condition, data.index);
        },
        updateTestData() {
            this.conditionManager.updateTestData(this.testData);
        }
    }
};
</script>
