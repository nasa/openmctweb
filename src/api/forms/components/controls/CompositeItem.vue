<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
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
<div :class="compositeCssClass">
    <FormRow :css-class="item.cssClass"
             :first="first"
             :row="row"
             @onChange="onChange"
    />
    <span class="composite-control-label">
        {{ item.name }}
    </span>
</div>
</template>

<script>

export default {
    components: {
        FormRow: () => import('@/api/forms/components/FormRow.vue')
    },
    props: {
        item: {
            type: Object,
            required: true
        },
        first: {
            type: Boolean,
            required: true
        },
        value: {
            type: String
        }
    },
    computed: {
        compositeCssClass() {
            return `l-composite-control l-${this.item.control}`;
        },
        row() {
            const row = this.item;
            row.value = JSON.parse(this.value);

            return row;
        }
    },
    methods: {
        onChange(data) {
            this.$emit('onChange', data);
        }
    }
};
</script>
