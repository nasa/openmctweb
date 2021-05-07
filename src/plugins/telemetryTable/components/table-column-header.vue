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
<th
    :style="{ width: columnWidth + 'px', 'max-width': columnWidth + 'px'}"
    :draggable="isEditing"
    @mouseup="sort"
    v-on="isEditing ? {
        dragstart: columnMoveStart,
        drop: columnMoveEnd,
        dragleave: hideDropTarget,
        dragover: dragOverColumn
    } : {}"
>
    <div
        class="c-telemetry-table__headers__content"
        :class="[
            isSortable ? 'is-sortable' : '',
            isSortable && sortOptions.key === headerKey ? 'is-sorting' : '',
            isSortable && sortOptions.direction].join(' ')"
    >
        <div
            class="c-telemetry-table__resize-hitarea"
            @mousedown="resizeColumnStart"
        ></div>
        <slot></slot>
    </div>
</th>
</template>
<script>
const MOVE_COLUMN_DT_TYPE = 'movecolumnfromindex';

export default {
    inject: ['openmct'],
    props: {
        headerKey: {
            type: String,
            default: undefined
        },
        headerIndex: {
            type: Number,
            default: undefined
        },
        isHeaderTitle: {
            type: Boolean,
            default: undefined
        },
        sortOptions: {
            type: Object,
            default: undefined
        },
        columnWidth: {
            type: Number,
            default: undefined
        },
        hotzone: Boolean,
        isEditing: Boolean
    },
    computed: {
        isSortable() {
            return this.sortOptions !== undefined;
        }
    },
    methods: {
        resizeColumnStart(event) {
            this.resizeStartX = event.clientX;
            this.resizeStartWidth = this.columnWidth;

            document.addEventListener('mouseup', this.resizeColumnEnd, {
                once: true,
                capture: true
            });
            document.addEventListener('mousemove', this.resizeColumn);
            event.preventDefault();
        },
        resizeColumnEnd(event) {
            this.resizeStartX = undefined;
            this.resizeStartWidth = undefined;
            document.removeEventListener('mousemove', this.resizeColumn);
            event.preventDefault();
            event.stopPropagation();

            this.$emit('resizeColumnEnd');
        },
        resizeColumn(event) {
            let delta = event.clientX - this.resizeStartX;
            let newWidth = this.resizeStartWidth + delta;
            let minWidth = parseInt(window.getComputedStyle(this.$el).minWidth, 10);
            if (newWidth > minWidth) {
                this.$emit('resizeColumn', this.headerKey, newWidth);
            }
        },
        columnMoveStart(event) {
            event.dataTransfer.setData(MOVE_COLUMN_DT_TYPE, this.headerIndex);
        },
        isColumnMoveEvent(event) {
            return [...event.dataTransfer.types].includes(MOVE_COLUMN_DT_TYPE);
        },
        dragOverColumn(event) {
            if (this.isColumnMoveEvent(event)) {
                event.preventDefault();
                this.updateDropOffset(event.currentTarget, event.clientX);
            } else {
                return false;
            }
        },
        updateDropOffset(element, clientX) {
            let thClientLeft = element.getBoundingClientRect().x;
            let offsetInHeader = clientX - thClientLeft;
            let dropOffsetLeft;

            if (offsetInHeader < element.offsetWidth / 2) {
                dropOffsetLeft = element.offsetLeft;
            } else {
                dropOffsetLeft = element.offsetLeft + element.offsetWidth;
            }

            this.$emit('dropTargetOffsetChanged', dropOffsetLeft);
            this.$emit('dropTargetActive', true);
        },
        hideDropTarget() {
            this.$emit('dropTargetActive', false);
        },
        columnMoveEnd(event) {
            if (this.isColumnMoveEvent(event)) {
                let toIndex = this.headerIndex;
                let fromIndex = event.dataTransfer.getData(MOVE_COLUMN_DT_TYPE);
                if (event.offsetX < event.target.offsetWidth / 2) {
                    if (toIndex > fromIndex) {
                        toIndex--;
                    }
                } else {
                    if (toIndex < fromIndex) {
                        toIndex++;
                    }
                }

                if (toIndex !== fromIndex) {
                    this.$emit('reorderColumn', fromIndex, toIndex);
                }
            }
        },
        sort() {
            this.$emit("sort");
        }
    }
};
</script>
