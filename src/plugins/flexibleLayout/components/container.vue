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
    class="c-fl-container"
    :style="[{'flex-basis': sizeString}]"
    :class="{'is-empty': !frames.length}"
>
    <div
        v-show="isEditing"
        class="c-fl-container__header"
        draggable="true"
        @dragstart="startContainerDrag"
    >
        <span class="c-fl-container__size-indicator">{{ sizeString }}</span>
    </div>

    <drop-hint
        class="c-fl-frame__drop-hint"
        :index="-1"
        :allow-drop="allowDrop"
        @object-drop-to="moveOrCreateNewFrame"
    />

    <div class="c-fl-container__frames-holder">
        <template
            v-for="(frame, i) in frames"
        >
            <frame-component
                :key="frame.id"
                class="c-fl-container__frame"
                :frame="frame"
                :index="i"
                :container-index="index"
                :is-editing="isEditing"
                :object-path="objectPath"
            />

            <drop-hint
                :key="i"
                class="c-fl-frame__drop-hint"
                :index="i"
                :allow-drop="allowDrop"
                @object-drop-to="moveOrCreateNewFrame"
            />

            <resize-handle
                v-if="(i !== frames.length - 1)"
                :key="i"
                :index="i"
                :orientation="rowsLayout ? 'horizontal' : 'vertical'"
                :is-editing="isEditing"
                @init-move="startFrameResizing"
                @move="frameResizing"
                @end-move="endFrameResizing"
            />
        </template>
    </div>
</div>
</template>

<script>
import FrameComponent from './frame.vue';
import ResizeHandle from './resizeHandle.vue';
import DropHint from './dropHint.vue';

const MIN_FRAME_SIZE = 5;

export default {
    components: {
        FrameComponent,
        ResizeHandle,
        DropHint
    },
    inject: ['openmct'],
    props: {
        container: {
            type: Object,
            required: true
        },
        index: {
            type: Number,
            required: true
        },
        rowsLayout: Boolean,
        isEditing: {
            type: Boolean,
            default: false
        },
        locked: {
            type: Boolean,
            default: false
        },
        objectPath: {
            type: Array,
            required: true
        }
    },
    computed: {
        frames() {
            return this.container.frames;
        },
        sizeString() {
            return `${Math.round(this.container.size)}%`;
        }
    },
    mounted() {
        let context = {
            item: this.$parent.domainObject,
            addContainer: this.addContainer,
            type: 'container',
            containerId: this.container.id
        };

        this.unsubscribeSelection = this.openmct.selection.selectable(this.$el, context, false);
    },
    beforeDestroy() {
        this.unsubscribeSelection();
    },
    methods: {
        allowDrop(event, index) {
            if (this.locked) {
                return false;
            }

            if (event.dataTransfer.types.includes('openmct/domain-object-path')) {
                return true;
            }

            let frameId = event.dataTransfer.getData('frameid');
            let containerIndex = Number(event.dataTransfer.getData('containerIndex'));

            if (!frameId) {
                return false;
            }

            if (containerIndex === this.index) {
                let frame = this.container.frames.filter((f) => f.id === frameId)[0];
                let framePos = this.container.frames.indexOf(frame);

                if (index === -1) {
                    return framePos !== 0;
                } else {
                    return framePos !== index && (framePos - 1) !== index;
                }
            } else {
                return true;
            }
        },
        moveOrCreateNewFrame(insertIndex, event) {
            if (event.dataTransfer.types.includes('openmct/domain-object-path')) {
                this.$emit(
                    'new-frame',
                    this.index,
                    insertIndex
                );

                return;
            }

            // move frame.
            let frameId = event.dataTransfer.getData('frameid');
            let containerIndex = Number(event.dataTransfer.getData('containerIndex'));
            this.$emit(
                'move-frame',
                this.index,
                insertIndex,
                frameId,
                containerIndex
            );
        },
        startFrameResizing(index) {
            let beforeFrame = this.frames[index];
            let afterFrame = this.frames[index + 1];

            this.maxMoveSize = beforeFrame.size + afterFrame.size;
        },
        frameResizing(index, delta, event) {
            let percentageMoved = Math.round(delta / this.getElSize() * 100);
            let beforeFrame = this.frames[index];
            let afterFrame = this.frames[index + 1];

            beforeFrame.size = this.getFrameSize(beforeFrame.size + percentageMoved);
            afterFrame.size = this.getFrameSize(afterFrame.size - percentageMoved);
        },
        endFrameResizing(index, event) {
            this.persist();
        },
        getElSize() {
            if (this.rowsLayout) {
                return this.$el.offsetWidth;
            } else {
                return this.$el.offsetHeight;
            }
        },
        getFrameSize(size) {
            if (size < MIN_FRAME_SIZE) {
                return MIN_FRAME_SIZE;
            } else if (size > (this.maxMoveSize - MIN_FRAME_SIZE)) {
                return (this.maxMoveSize - MIN_FRAME_SIZE);
            } else {
                return size;
            }
        },
        persist() {
            this.$emit('persist', this.index);
        },
        startContainerDrag(event) {
            event.dataTransfer.setData('containerid', this.container.id);
        }
    }
};
</script>
