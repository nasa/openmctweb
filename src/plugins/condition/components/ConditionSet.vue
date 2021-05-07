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
<div class="c-cs">
    <section class="c-cs__current-output c-section">
        <div class="c-cs__content c-cs__current-output-value">
            <span class="c-cs__current-output-value__label">Current Output</span>
            <span class="c-cs__current-output-value__value">
                <template v-if="currentConditionOutput">
                    {{ currentConditionOutput }}
                </template>
                <template v-else>
                    {{ defaultConditionOutput }}
                </template>
            </span>
        </div>
    </section>
    <div class="c-cs__test-data-and-conditions-w">
        <TestData class="c-cs__test-data"
                  :is-editing="isEditing"
                  :test-data="testData"
                  :telemetry="telemetryObjs"
                  @updateTestData="updateTestData"
        />
        <ConditionCollection class="c-cs__conditions"
                             :is-editing="isEditing"
                             :test-data="testData"
                             @conditionSetResultUpdated="updateCurrentOutput"
                             @updateDefaultOutput="updateDefaultOutput"
                             @telemetryUpdated="updateTelemetry"
        />
    </div>
</div>
</template>

<script>
import TestData from './TestData.vue';
import ConditionCollection from './ConditionCollection.vue';

export default {
    components: {
        TestData,
        ConditionCollection
    },
    inject: ["openmct", "domainObject"],
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            currentConditionOutput: '',
            defaultConditionOutput: '',
            telemetryObjs: [],
            testData: {}
        };
    },
    mounted() {
        this.conditionSetIdentifier = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.testData = {
            applied: false,
            conditionTestInputs: this.domainObject.configuration.conditionTestData || []
        };
    },
    methods: {
        updateCurrentOutput(currentConditionResult) {
            this.currentConditionOutput = currentConditionResult.output;
        },
        updateDefaultOutput(output) {
            this.currentConditionOutput = output;
        },
        updateTelemetry(telemetryObjs) {
            this.telemetryObjs = telemetryObjs;
        },
        updateTestData(testData) {
            this.testData = testData;
        }
    }
};
</script>

