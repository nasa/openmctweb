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
<!-- Resize handles -->
<div
    class="c-frame-edit"
    :style="marqueeStyle"
>
    <div
        class="c-frame-edit__handle c-frame-edit__handle--nw"
        @mousedown="startResize([1,1], [-1,-1], $event)"
    ></div>
    <div
        class="c-frame-edit__handle c-frame-edit__handle--ne"
        @mousedown="startResize([0,1], [1,-1], $event)"
    ></div>
    <div
        class="c-frame-edit__handle c-frame-edit__handle--sw"
        @mousedown="startResize([1,0], [-1,1], $event)"
    ></div>
    <div
        class="c-frame-edit__handle c-frame-edit__handle--se"
        @mousedown="startResize([0,0], [1,1], $event)"
    ></div>
</div>
</template>

<script>
import LayoutDrag from './../LayoutDrag';

export default {
    inject: ['openmct'],
    props: {
        selectedLayoutItems: {
            type: Array,
            default: undefined
        },
        gridSize: {
            type: Array,
            required: true,
            validator: (arr) => arr && arr.length === 2
                && arr.every(el => typeof el === 'number')
        }
    },
    data() {
        return {
            dragPosition: undefined
        };
    },
    computed: {
        marqueePosition() {
            let x = Number.POSITIVE_INFINITY;
            let y = Number.POSITIVE_INFINITY;
            let width = Number.NEGATIVE_INFINITY;
            let height = Number.NEGATIVE_INFINITY;

            this.selectedLayoutItems.forEach(item => {
                if (item.x2 !== undefined) {
                    let lineWidth = Math.abs(item.x - item.x2);
                    let lineMinX = Math.min(item.x, item.x2);
                    x = Math.min(lineMinX, x);
                    width = Math.max(lineWidth + lineMinX, width);
                } else {
                    x = Math.min(item.x, x);
                    width = Math.max(item.width + item.x, width);
                }

                if (item.y2 !== undefined) {
                    let lineHeight = Math.abs(item.y - item.y2);
                    let lineMinY = Math.min(item.y, item.y2);
                    y = Math.min(lineMinY, y);
                    height = Math.max(lineHeight + lineMinY, height);
                } else {
                    y = Math.min(item.y, y);
                    height = Math.max(item.height + item.y, height);
                }
            });

            if (this.dragPosition) {
                [x, y] = this.dragPosition.position;
                [width, height] = this.dragPosition.dimensions;
            } else {
                width = width - x;
                height = height - y;
            }

            return {
                x: x,
                y: y,
                width: width,
                height: height
            };
        },
        marqueeStyle() {
            return {
                left: (this.gridSize[0] * this.marqueePosition.x) + 'px',
                top: (this.gridSize[1] * this.marqueePosition.y) + 'px',
                width: (this.gridSize[0] * this.marqueePosition.width) + 'px',
                height: (this.gridSize[1] * this.marqueePosition.height) + 'px'
            };
        }
    },
    methods: {
        updatePosition(event) {
            let currentPosition = [event.pageX, event.pageY];
            this.initialPosition = this.initialPosition || currentPosition;
            this.delta = currentPosition.map(function (value, index) {
                return value - this.initialPosition[index];
            }.bind(this));
        },
        startResize(posFactor, dimFactor, event) {
            document.body.addEventListener('mousemove', this.continueResize);
            document.body.addEventListener('mouseup', this.endResize);
            this.marqueeStartPosition = {
                position: [this.marqueePosition.x, this.marqueePosition.y],
                dimensions: [this.marqueePosition.width, this.marqueePosition.height]
            };
            this.updatePosition(event);
            this.activeDrag = new LayoutDrag(this.marqueeStartPosition, posFactor, dimFactor, this.gridSize);
            event.preventDefault();
        },
        continueResize(event) {
            event.preventDefault();
            this.updatePosition(event);
            this.dragPosition = this.activeDrag.getAdjustedPositionAndDimensions(this.delta);
        },
        endResize(event) {
            document.body.removeEventListener('mousemove', this.continueResize);
            document.body.removeEventListener('mouseup', this.endResize);
            this.continueResize(event);

            let marqueeStartWidth = this.marqueeStartPosition.dimensions[0];
            let marqueeStartHeight = this.marqueeStartPosition.dimensions[1];
            let marqueeStartX = this.marqueeStartPosition.position[0];
            let marqueeStartY = this.marqueeStartPosition.position[1];

            let marqueeEndX = this.dragPosition.position[0];
            let marqueeEndY = this.dragPosition.position[1];
            let marqueeEndWidth = this.dragPosition.dimensions[0];
            let marqueeEndHeight = this.dragPosition.dimensions[1];

            let scaleWidth = marqueeEndWidth / marqueeStartWidth;
            let scaleHeight = marqueeEndHeight / marqueeStartHeight;

            let marqueeStart = {
                x: marqueeStartX,
                y: marqueeStartY,
                height: marqueeStartWidth,
                width: marqueeStartHeight
            };
            let marqueeEnd = {
                x: marqueeEndX,
                y: marqueeEndY,
                width: marqueeEndWidth,
                height: marqueeEndHeight
            };
            let marqueeOffset = {
                x: marqueeEnd.x - marqueeStart.x,
                y: marqueeEnd.y - marqueeStart.y
            };

            this.$emit('endResize', scaleWidth, scaleHeight, marqueeStart, marqueeOffset);
            this.dragPosition = undefined;
            this.initialPosition = undefined;
            this.marqueeStartPosition = undefined;
            this.delta = undefined;
            event.preventDefault();
        }
    }
};
</script>
