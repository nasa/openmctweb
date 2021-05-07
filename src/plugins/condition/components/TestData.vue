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
<section v-show="isEditing"
         id="test-data"
         :class="{ 'is-expanded': expanded }"
>
    <div class="c-cs__header c-section__header">
        <span
            class="c-disclosure-triangle c-tree__item__view-control is-enabled"
            :class="{ 'c-disclosure-triangle--expanded': expanded }"
            @click="expanded = !expanded"
        ></span>
        <div class="c-cs__header-label c-section__label">Test Data</div>
    </div>
    <div v-if="expanded"
         class="c-cs__content"
    >
        <div class="c-cs__test-data__controls c-cdef__controls"
             :disabled="!telemetry.length"
        >
            <label class="c-toggle-switch">
                <input
                    type="checkbox"
                    :checked="isApplied"
                    @change="applyTestData"
                >
                <span class="c-toggle-switch__slider"></span>
                <span class="c-toggle-switch__label">Apply Test Data</span>
            </label>
        </div>
        <div class="c-cs-tests">
            <span v-for="(testInput, tIndex) in testInputs"
                  :key="tIndex"
                  class="c-test-datum c-cs-test"
            >
                <span class="c-cs-test__label">Set</span>
                <span class="c-cs-test__controls">
                    <span class="c-cdef__control">
                        <select v-model="testInput.telemetry"
                                @change="updateMetadata(testInput)"
                        >
                            <option value="">- Select Telemetry -</option>
                            <option v-for="(telemetryOption, index) in telemetry"
                                    :key="index"
                                    :value="telemetryOption.identifier"
                            >
                                {{ telemetryOption.name }}
                            </option>
                        </select>
                    </span>
                    <span v-if="testInput.telemetry"
                          class="c-cdef__control"
                    >
                        <select v-model="testInput.metadata"
                                @change="updateTestData"
                        >
                            <option value="">- Select Field -</option>
                            <option v-for="(option, index) in telemetryMetadataOptions[getId(testInput.telemetry)]"
                                    :key="index"
                                    :value="option.key"
                            >
                                {{ option.name }}
                            </option>
                        </select>
                    </span>
                    <span v-if="testInput.metadata"
                          class="c-cdef__control__inputs"
                    >
                        <input v-model="testInput.value"
                               placeholder="Enter test input"
                               type="text"
                               class="c-cdef__control__input"
                               @change="updateTestData"
                        >
                    </span>
                </span>
                <div class="c-cs-test__buttons">
                    <button class="c-click-icon c-test-data__duplicate-button icon-duplicate"
                            title="Duplicate this test datum"
                            @click="addTestInput(testInput)"
                    ></button>
                    <button class="c-click-icon c-test-data__delete-button icon-trash"
                            title="Delete this test datum"
                            @click="removeTestInput(tIndex)"
                    ></button>
                </div>
            </span>
        </div>
        <button
            v-show="isEditing"
            id="addTestDatum"
            class="c-button c-button--major icon-plus labeled"
            @click="addTestInput"
        >
            <span class="c-cs-button__label">Add Test Datum</span>
        </button>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        isEditing: Boolean,
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        },
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
            isApplied: false,
            testInputs: [],
            telemetryMetadataOptions: {}
        };
    },
    watch: {
        isEditing(editing) {
            if (!editing) {
                this.resetApplied();
            }
        },
        telemetry: {
            handler() {
                this.initializeMetadata();
            },
            deep: true
        },
        testData: {
            handler() {
                this.initialize();
            },
            deep: true
        }
    },
    beforeDestroy() {
        this.resetApplied();
    },
    mounted() {
        this.initialize();
        this.initializeMetadata();
    },
    methods: {
        applyTestData() {
            this.isApplied = !this.isApplied;
            this.updateTestData();
        },
        initialize() {
            if (this.testData && this.testData.conditionTestInputs) {
                this.testInputs = this.testData.conditionTestInputs;
            }

            if (!this.testInputs.length) {
                this.addTestInput();
            }
        },
        initializeMetadata() {
            this.telemetry.forEach((telemetryObject) => {
                const id = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                let telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);
                this.telemetryMetadataOptions[id] = telemetryMetadata.values().slice();
            });
        },
        addTestInput(testInput) {
            this.testInputs.push(Object.assign({
                telemetry: '',
                metadata: '',
                input: ''
            }, testInput));
        },
        removeTestInput(index) {
            this.testInputs.splice(index, 1);
            this.updateTestData();
        },
        getId(identifier) {
            if (identifier) {
                return this.openmct.objects.makeKeyString(identifier);
            }

            return [];
        },
        updateMetadata(testInput) {
            if (testInput.telemetry) {
                const id = this.openmct.objects.makeKeyString(testInput.telemetry);
                if (this.telemetryMetadataOptions[id]) {
                    return;
                }

                let telemetryMetadata = this.openmct.telemetry.getMetadata(testInput);
                this.telemetryMetadataOptions[id] = telemetryMetadata.values().slice();
            }
        },
        resetApplied() {
            this.isApplied = false;
            this.updateTestData();
        },
        updateTestData() {
            this.$emit('updateTestData', {
                applied: this.isApplied,
                conditionTestInputs: this.testInputs
            });
        }
    }
};
</script>
