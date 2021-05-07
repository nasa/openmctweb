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
<div class="u-contents">
    <div class="c-cdef__separator c-row-separator"></div>
    <span class="c-cdef__label">{{ setRowLabel }}</span>
    <span class="c-cdef__controls">
        <span class="c-cdef__control">
            <select ref="telemetrySelect"
                    v-model="criterion.telemetry"
                    @change="updateMetadataOptions"
            >
                <option value="">- Select Telemetry -</option>
                <option value="all">all telemetry</option>
                <option value="any">any telemetry</option>
                <option v-for="telemetryOption in telemetry"
                        :key="telemetryOption.identifier.key"
                        :value="telemetryOption.identifier"
                >
                    {{ telemetryOption.name }}
                </option>
            </select>
        </span>
        <span v-if="criterion.telemetry"
              class="c-cdef__control"
        >
            <select ref="metadataSelect"
                    v-model="criterion.metadata"
                    @change="updateOperations"
            >
                <option value="">- Select Field -</option>
                <option v-for="option in telemetryMetadataOptions"
                        :key="option.key"
                        :value="option.key"
                >
                    {{ option.name }}
                </option>
                <option value="dataReceived">any data received</option>
            </select>
        </span>
        <span v-if="criterion.telemetry && criterion.metadata"
              class="c-cdef__control"
        >
            <select v-model="criterion.operation"
                    @change="updateInputVisibilityAndValues"
            >
                <option value="">- Select Comparison -</option>
                <option v-for="option in filteredOps"
                        :key="option.name"
                        :value="option.name"
                >
                    {{ option.text }}
                </option>
            </select>
            <template v-if="!enumerations.length">
                <span v-for="(item, inputIndex) in inputCount"
                      :key="inputIndex"
                      class="c-cdef__control__inputs"
                >
                    <input v-model="criterion.input[inputIndex]"
                           class="c-cdef__control__input"
                           :type="setInputType"
                           @change="persist"
                    >
                    <span v-if="inputIndex < inputCount-1">and</span>
                </span>
                <span v-if="criterion.metadata === 'dataReceived'">seconds</span>
            </template>
            <span v-else>
                <span v-if="inputCount && criterion.operation"
                      class="c-cdef__control"
                >
                    <select v-model="criterion.input[0]"
                            @change="persist"
                    >
                        <option v-for="option in enumerations"
                                :key="option.string"
                                :value="option.value.toString()"
                        >
                            {{ option.string }}
                        </option>
                    </select>
                </span>
            </span>
        </span>
    </span>
</div>
</template>

<script>
import { OPERATIONS, INPUT_TYPES } from '../utils/operations';
import {TRIGGER_CONJUNCTION} from "../utils/constants";

export default {
    inject: ['openmct'],
    props: {
        criterion: {
            type: Object,
            required: true
        },
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        },
        index: {
            type: Number,
            required: true
        },
        trigger: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            telemetryMetadataOptions: [],
            operations: OPERATIONS,
            inputCount: 0,
            rowLabel: '',
            operationFormat: '',
            enumerations: [],
            inputTypes: INPUT_TYPES
        };
    },
    computed: {
        setRowLabel: function () {
            let operator = TRIGGER_CONJUNCTION[this.trigger];

            return (this.index !== 0 ? operator : '') + ' when';
        },
        filteredOps: function () {
            if (this.criterion.metadata === 'dataReceived') {
                return this.operations.filter(op => op.name === 'isStale');
            } else {
                return this.operations.filter(op => op.appliesTo.indexOf(this.operationFormat) !== -1);
            }
        },
        setInputType: function () {
            let type = '';
            for (let i = 0; i < this.filteredOps.length; i++) {
                if (this.criterion.operation === this.filteredOps[i].name) {
                    if (this.filteredOps[i].appliesTo.length) {
                        type = this.inputTypes[this.filteredOps[i].appliesTo[0]];
                    } else {
                        type = 'text';
                    }

                    break;
                }
            }

            return type;
        }
    },
    watch: {
        telemetry: {
            handler(newTelemetry, oldTelemetry) {
                this.checkTelemetry();
            },
            deep: true
        }
    },
    mounted() {
        this.updateMetadataOptions();
    },
    methods: {
        checkTelemetry() {
            if (this.criterion.telemetry) {
                const isAnyAllTelemetry = this.criterion.telemetry === 'any' || this.criterion.telemetry === 'all';
                const telemetryForCriterionExists = this.telemetry.find((telemetryObj) => this.openmct.objects.areIdsEqual(this.criterion.telemetry, telemetryObj.identifier));
                if (!isAnyAllTelemetry
                    && !telemetryForCriterionExists) {
                    //telemetry being used was removed. So reset this criterion.
                    this.criterion.telemetry = '';
                    this.criterion.metadata = '';
                    this.criterion.input = [];
                    this.criterion.operation = '';
                    this.persist();
                } else {
                    this.updateMetadataOptions();
                }
            }
        },
        updateOperationFormat() {
            this.enumerations = [];
            let foundMetadata = this.telemetryMetadataOptions.find((value) => {
                return value.key === this.criterion.metadata;
            });
            if (foundMetadata) {
                if (foundMetadata.enumerations !== undefined) {
                    this.operationFormat = 'enum';
                    this.enumerations = foundMetadata.enumerations;
                } else if (foundMetadata.format === 'string' || foundMetadata.format === 'number') {
                    this.operationFormat = foundMetadata.format;
                } else if (Object.prototype.hasOwnProperty.call(foundMetadata.hints, 'range')) {
                    this.operationFormat = 'number';
                } else if (Object.prototype.hasOwnProperty.call(foundMetadata.hints, 'domain')) {
                    this.operationFormat = 'number';
                } else if (foundMetadata.key === 'name') {
                    this.operationFormat = 'string';
                } else {
                    this.operationFormat = 'number';
                }
            } else if (this.criterion.metadata === 'dataReceived') {
                this.operationFormat = 'number';
            }

            this.updateInputVisibilityAndValues();
        },
        updateMetadataOptions(ev) {
            if (ev) {
                this.clearDependentFields(ev.target);
                this.persist();
            }

            if (this.criterion.telemetry) {
                let telemetryObjects = this.telemetry;
                if (this.criterion.telemetry !== 'all' && this.criterion.telemetry !== 'any') {
                    const found = this.telemetry.find(telemetryObj => (this.openmct.objects.areIdsEqual(telemetryObj.identifier, this.criterion.telemetry)));
                    telemetryObjects = found ? [found] : [];
                }

                this.telemetryMetadataOptions = [];
                telemetryObjects.forEach(telemetryObject => {
                    let telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);
                    this.addMetaDataOptions(telemetryMetadata.values());
                });
                this.updateOperations();
            }
        },
        addMetaDataOptions(options) {
            if (!this.telemetryMetadataOptions) {
                this.telemetryMetadataOptions = options;
            }

            options.forEach((option) => {
                const found = this.telemetryMetadataOptions.find((metadataOption) => {
                    return (metadataOption.key && (metadataOption.key === option.key)) && (metadataOption.name && (metadataOption.name === option.name));
                });
                if (!found) {
                    this.telemetryMetadataOptions.push(option);
                }
            });
        },
        updateOperations(ev) {
            this.updateOperationFormat();
            if (ev) {
                this.clearDependentFields(ev.target);
                this.persist();
            }
        },
        updateInputVisibilityAndValues(ev) {
            if (ev) {
                this.clearDependentFields();
                this.persist();
            }

            for (let i = 0; i < this.filteredOps.length; i++) {
                if (this.criterion.operation === this.filteredOps[i].name) {
                    this.inputCount = this.filteredOps[i].inputCount;
                }
            }

            if (!this.inputCount) {
                this.criterion.input = [];
            }
        },
        clearDependentFields(el) {
            if (el === this.$refs.telemetrySelect) {
                this.criterion.metadata = '';
            } else if (el === this.$refs.metadataSelect) {
                if (!this.filteredOps.find(operation => operation.name === this.criterion.operation)) {
                    this.criterion.operation = '';
                    this.criterion.input = this.enumerations.length ? [this.enumerations[0].value.toString()] : [];
                    this.inputCount = 0;
                }
            } else {
                if (this.enumerations.length && !this.criterion.input.length) {
                    this.criterion.input = [this.enumerations[0].value.toString()];
                }

                this.inputCount = 0;
            }
        },
        persist() {
            this.$emit('persist', this.criterion);
        }
    }
};
</script>
