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
<div v-show="isValidTarget">
    <div
        class="c-drop-hint c-drop-hint--always-show"
        :class="{'is-mouse-over': isMouseOver}"
        @dragover.prevent
        @dragenter="dragenter"
        @dragleave="dragleave"
        @drop="dropHandler"
    ></div>
</div>
</template>

<script>
export default {
    props: {
        index: {
            type: Number,
            required: true
        },
        allowDrop: {
            type: Function,
            required: true
        }
    },
    data() {
        return {
            isMouseOver: false,
            isValidTarget: false
        };
    },
    mounted() {
        document.addEventListener('dragstart', this.dragstart);
        document.addEventListener('dragend', this.dragend);
        document.addEventListener('drop', this.dragend);
    },
    destroyed() {
        document.removeEventListener('dragstart', this.dragstart);
        document.removeEventListener('dragend', this.dragend);
        document.removeEventListener('drop', this.dragend);
    },
    methods: {
        dragenter() {
            this.isMouseOver = true;
        },
        dragleave() {
            this.isMouseOver = false;
        },
        dropHandler(event) {
            this.$emit('object-drop-to', this.index, event);
            this.isValidTarget = false;
        },
        dragstart(event) {
            this.isValidTarget = this.allowDrop(event, this.index);
        },
        dragend() {
            this.isValidTarget = false;
        }
    }
};
</script>
