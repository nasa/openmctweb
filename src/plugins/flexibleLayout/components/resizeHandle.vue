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
<div
    v-show="isEditing && !isDragging"
    class="c-fl-frame__resize-handle"
    :class="[orientation]"
    @mousedown="mousedown"
></div>
</template>

<script>
export default {
    props: {
        orientation: {
            type: String,
            required: true
        },
        index: {
            type: Number,
            required: true
        },
        isEditing: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            initialPos: 0,
            isDragging: false
        };
    },
    mounted() {
        document.addEventListener('dragstart', this.setDragging);
        document.addEventListener('dragend', this.unsetDragging);
        document.addEventListener('drop', this.unsetDragging);
    },
    destroyed() {
        document.removeEventListener('dragstart', this.setDragging);
        document.removeEventListener('dragend', this.unsetDragging);
        document.removeEventListener('drop', this.unsetDragging);
    },
    methods: {
        mousedown(event) {
            event.preventDefault();

            this.$emit('init-move', this.index);

            document.body.addEventListener('mousemove', this.mousemove);
            document.body.addEventListener('mouseup', this.mouseup);
        },
        mousemove(event) {
            event.preventDefault();

            let elSize;
            let mousePos;
            let delta;

            if (this.orientation === 'horizontal') {
                elSize = this.$el.getBoundingClientRect().x;
                mousePos = event.clientX;
            } else {
                elSize = this.$el.getBoundingClientRect().y;
                mousePos = event.clientY;
            }

            delta = mousePos - elSize;

            this.$emit('move', this.index, delta, event);
        },
        mouseup(event) {
            this.$emit('end-move', event);

            document.body.removeEventListener('mousemove', this.mousemove);
            document.body.removeEventListener('mouseup', this.mouseup);
        },
        setDragging(event) {
            this.isDragging = true;
        },
        unsetDragging(event) {
            this.isDragging = false;
        }
    }
};
</script>
