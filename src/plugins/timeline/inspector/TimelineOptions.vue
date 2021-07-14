<!--
 Open MCT, Copyright (c) 2014-2020, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div>
    <ul v-if="canEdit"
        class="grid-properties"
    >
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Use Independent time"
            >Use Independent Time</div>
            <div class="grid-cell value">
                <input v-model="useIndependentTime"
                       type="checkbox"
                       @change="updateTimeOption"
                >
            </div>
        </li>
    </ul>
    <ul v-else
        class="grid-properties"
    >
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Use Independent Time."
            >Use Independent Time</div>
            <div class="grid-cell value">
                {{ useIndependentTime ? "Enabled" : "Disabled" }}
            </div>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            useIndependentTime: this.domainObject.configuration && this.domainObject.configuration.useIndependentTime,
            isEditing: this.openmct.editor.isEditing()
        };
    },
    computed: {
        canEdit() {
            return this.isEditing && !this.domainObject.locked;
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        updateTimeOption() {
            this.openmct.objects.mutate(this.domainObject, 'configuration.useIndependentTime', this.useIndependentTime);
        }
    }
};
</script>
