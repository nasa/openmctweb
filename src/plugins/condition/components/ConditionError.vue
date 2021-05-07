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
<div v-if="conditionErrors.length"
     class="c-condition__errors"
>
    <div v-for="(error, index) in conditionErrors"
         :key="index"
         class="u-alert u-alert--block u-alert--with-icon"
    >{{ error.message.errorText }} {{ error.additionalInfo }}
    </div>
</div>
</template>

<script>

import { ERROR } from "@/plugins/condition/utils/constants";

export default {
    name: 'ConditionError',
    inject: [
        'openmct'
    ],
    props: {
        condition: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        return {
            conditionErrors: []
        };
    },
    mounted() {
        this.getConditionErrors();
    },
    methods: {
        getConditionErrors() {
            if (this.condition) {
                this.condition.configuration.criteria.forEach((criterion, index) => {
                    this.getCriterionErrors(criterion, index);
                });
            }
        },
        getCriterionErrors(criterion, index) {
            //It is sufficient to check for absence of telemetry here since the condition manager ensures that telemetry for a criterion is set if it exists
            const isInvalidTelemetry = !criterion.telemetry && (criterion.telemetry !== 'all' && criterion.telemetry !== 'any');
            if (isInvalidTelemetry) {
                this.conditionErrors.push({
                    message: ERROR.TELEMETRY_NOT_FOUND,
                    additionalInfo: ''
                });
            }
        }
    }
};
</script>
