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
<div class="c-condition-h"
     :class="{ 'is-drag-target': draggingOver }"
     @dragover.prevent
     @drop.prevent="dropCondition($event, conditionIndex)"
     @dragenter="dragEnter($event, conditionIndex)"
     @dragleave="dragLeave($event, conditionIndex)"
>
    <div class="c-condition-h__drop-target"></div>
    <div v-if="isEditing"
         :class="{'is-current': condition.id === currentConditionId}"
         class="c-condition c-condition--edit"
    >
        <!-- Edit view -->
        <div class="c-condition__header">
            <span class="c-condition__drag-grippy c-grippy c-grippy--vertical-drag"
                  title="Drag to reorder conditions"
                  :class="[{ 'is-enabled': !condition.isDefault }, { 'hide-nice': condition.isDefault }]"
                  :draggable="!condition.isDefault"
                  @dragstart="dragStart"
                  @dragend="dragEnd"
            ></span>

            <span class="c-condition__disclosure c-disclosure-triangle c-tree__item__view-control is-enabled"
                  :class="{ 'c-disclosure-triangle--expanded': expanded }"
                  @click="expanded = !expanded"
            ></span>

            <span class="c-condition__name">{{ condition.configuration.name }}</span>
            <span class="c-condition__summary">
                <template v-if="!condition.isDefault && !canEvaluateCriteria">
                    Define criteria
                </template>
                <span v-else>
                    <condition-description :show-label="false"
                                           :condition="condition"
                    />
                </span>
            </span>

            <div class="c-condition__buttons">
                <button v-if="!condition.isDefault"
                        class="c-click-icon c-condition__duplicate-button icon-duplicate"
                        title="Duplicate this condition"
                        @click="cloneCondition"
                ></button>

                <button v-if="!condition.isDefault"
                        class="c-click-icon c-condition__delete-button icon-trash"
                        title="Delete this condition"
                        @click="removeCondition"
                ></button>
            </div>
        </div>
        <div v-if="expanded"
             class="c-condition__definition c-cdef"
        >
            <span class="c-cdef__separator c-row-separator"></span>
            <span class="c-cdef__label">Condition Name</span>
            <span class="c-cdef__controls">
                <input v-model="condition.configuration.name"
                       class="t-condition-input__name"
                       type="text"
                       @change="persist"
                >
            </span>

            <span class="c-cdef__label">Output</span>
            <span class="c-cdef__controls">
                <span class="c-cdef__control">
                    <select v-model="selectedOutputSelection"
                            @change="setOutputValue"
                    >
                        <option v-for="option in outputOptions"
                                :key="option"
                                :value="option"
                        >
                            {{ initCap(option) }}
                        </option>
                    </select>
                </span>
                <span class="c-cdef__control">
                    <input v-if="selectedOutputSelection === outputOptions[2]"
                           v-model="condition.configuration.output"
                           class="t-condition-name-input"
                           type="text"
                           @change="persist"
                    >
                </span>
            </span>

            <div v-if="!condition.isDefault"
                 class="c-cdef__match-and-criteria"
            >
                <span class="c-cdef__separator c-row-separator"></span>
                <span class="c-cdef__label">Match</span>
                <span class="c-cdef__controls">
                    <select v-model="condition.configuration.trigger"
                            @change="persist"
                    >
                        <option v-for="option in triggers"
                                :key="option.value"
                                :value="option.value"
                        > {{ option.label }}</option>
                    </select>
                </span>

                <template v-if="telemetry.length || condition.configuration.criteria.length">
                    <div v-for="(criterion, index) in condition.configuration.criteria"
                         :key="criterion.id"
                         class="c-cdef__criteria"
                    >
                        <Criterion :telemetry="telemetry"
                                   :criterion="criterion"
                                   :index="index"
                                   :trigger="condition.configuration.trigger"
                                   :is-default="condition.configuration.criteria.length === 1"
                                   @persist="persist"
                        />
                        <div class="c-cdef__criteria__buttons">
                            <button class="c-click-icon c-cdef__criteria-duplicate-button icon-duplicate"
                                    title="Duplicate this criteria"
                                    @click="cloneCriterion(index)"
                            ></button>
                            <button v-if="!(condition.configuration.criteria.length === 1)"
                                    class="c-click-icon c-cdef__criteria-duplicate-button icon-trash"
                                    title="Delete this criteria"
                                    @click="removeCriterion(index)"
                            ></button>
                        </div>
                    </div>
                </template>
                <div class="c-cdef__separator c-row-separator"></div>
                <div class="c-cdef__controls"
                     :disabled="!telemetry.length"
                >
                    <button
                        class="c-cdef__add-criteria-button c-button c-button--labeled icon-plus"
                        @click="addCriteria"
                    >
                        <span class="c-button__label">Add Criteria</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div v-else
         class="c-condition c-condition--browse"
         :class="{'is-current': condition.id === currentConditionId}"
    >
        <!-- Browse view -->
        <div class="c-condition__header">
            <span class="c-condition__name">
                {{ condition.configuration.name }}
            </span>
            <span class="c-condition__output">
                Output: {{ condition.configuration.output }}
            </span>
        </div>
        <div class="c-condition__summary">
            <condition-description :show-label="false"
                                   :condition="condition"
            />
        </div>
    </div>
</div>
</template>

<script>
import Criterion from './Criterion.vue';
import ConditionDescription from "./ConditionDescription.vue";
import { TRIGGER, TRIGGER_LABEL } from "@/plugins/condition/utils/constants";
import uuid from 'uuid';

export default {
    components: {
        Criterion,
        ConditionDescription
    },
    inject: ['openmct'],
    props: {
        currentConditionId: {
            type: String,
            default: ''
        },
        condition: {
            type: Object,
            required: true
        },
        conditionIndex: {
            type: Number,
            required: true
        },
        isEditing: {
            type: Boolean,
            required: true
        },
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        },
        isDragging: {
            type: Boolean,
            default: false
        },
        moveIndex: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            currentCriteria: this.currentCriteria,
            expanded: true,
            trigger: 'all',
            selectedOutputSelection: '',
            outputOptions: ['false', 'true', 'string'],
            criterionIndex: 0,
            draggingOver: false,
            isDefault: this.condition.isDefault
        };
    },
    computed: {
        triggers() {
            const keys = Object.keys(TRIGGER);
            const triggerOptions = [];
            keys.forEach((trigger) => {
                triggerOptions.push({
                    value: TRIGGER[trigger],
                    label: `when ${TRIGGER_LABEL[TRIGGER[trigger]]}`
                });
            });

            return triggerOptions;
        },
        canEvaluateCriteria: function () {
            let criteria = this.condition.configuration.criteria;
            if (criteria.length) {
                let lastCriterion = criteria[criteria.length - 1];
                if (lastCriterion.telemetry
                    && lastCriterion.operation
                    && (lastCriterion.input.length
                        || lastCriterion.operation === 'isDefined'
                        || lastCriterion.operation === 'isUndefined')) {
                    return true;
                }
            }

            return false;
        }
    },
    destroyed() {
        this.destroy();
    },
    mounted() {
        this.setOutputSelection();
    },
    methods: {
        setOutputSelection() {
            let conditionOutput = this.condition.configuration.output;
            if (conditionOutput) {
                if (conditionOutput !== 'false' && conditionOutput !== 'true') {
                    this.selectedOutputSelection = 'string';
                } else {
                    this.selectedOutputSelection = conditionOutput;
                }
            }
        },
        setOutputValue() {
            if (this.selectedOutputSelection === 'string') {
                this.condition.configuration.output = '';
            } else {
                this.condition.configuration.output = this.selectedOutputSelection;
            }

            this.persist();
        },
        addCriteria() {
            const criteriaObject = {
                id: uuid(),
                telemetry: '',
                operation: '',
                input: '',
                metadata: ''
            };
            this.condition.configuration.criteria.push(criteriaObject);
        },
        dragStart(event) {
            event.dataTransfer.clearData();
            event.dataTransfer.setData('dragging', event.target); // required for FF to initiate drag
            event.dataTransfer.effectAllowed = "copyMove";
            event.dataTransfer.setDragImage(event.target.closest('.c-condition-h'), 0, 0);
            this.$emit('setMoveIndex', this.conditionIndex);
        },
        dragEnd() {
            this.dragStarted = false;
            this.$emit('dragComplete');
        },
        dropCondition(event, targetIndex) {
            if (!this.isDragging) {
                return;
            }

            if (targetIndex > this.moveIndex) {
                targetIndex--;
            } // for 'downward' move

            if (this.isValidTarget(targetIndex)) {
                this.dragElement = undefined;
                this.draggingOver = false;
                this.$emit('dropCondition', targetIndex);
            }
        },
        dragEnter(event, targetIndex) {
            if (!this.isDragging) {
                return;
            }

            if (targetIndex > this.moveIndex) {
                targetIndex--;
            } // for 'downward' move

            if (this.isValidTarget(targetIndex)) {
                this.dragElement = event.target.parentElement;
                this.draggingOver = true;
            }
        },
        dragLeave(event) {
            if (event.target.parentElement === this.dragElement) {
                this.draggingOver = false;
                this.dragElement = undefined;
            }
        },
        isValidTarget(targetIndex) {
            return this.moveIndex !== targetIndex;
        },
        destroy() {
        },
        removeCondition() {
            this.$emit('removeCondition', this.condition.id);
        },
        cloneCondition() {
            this.$emit('cloneCondition', {
                condition: this.condition,
                index: this.conditionIndex
            });
        },
        removeCriterion(index) {
            this.condition.configuration.criteria.splice(index, 1);
            this.persist();
        },
        cloneCriterion(index) {
            const clonedCriterion = JSON.parse(JSON.stringify(this.condition.configuration.criteria[index]));
            clonedCriterion.id = uuid();
            this.condition.configuration.criteria.splice(index + 1, 0, clonedCriterion);
            this.persist();
        },
        persist() {
            this.$emit('updateCondition', {
                condition: this.condition
            });
        },
        initCap(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    }
};
</script>
