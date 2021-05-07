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
    class="l-layout__frame c-frame no-frame c-line-view"
    :class="[styleClass]"
    :style="style"
>
    <svg
        width="100%"
        height="100%"
    >
        <line
            class="c-line-view__hover-indicator"
            v-bind="linePosition"
            vector-effect="non-scaling-stroke"
        />
        <line
            class="c-line-view__line"
            v-bind="linePosition"
            :stroke="stroke"
            vector-effect="non-scaling-stroke"
        />
    </svg>

    <div
        class="c-frame__move-bar"
        @mousedown="startDrag($event)"
    ></div>
    <div
        v-if="showFrameEdit"
        class="c-frame-edit"
    >
        <div
            class="c-frame-edit__handle"
            :class="startHandleClass"
            @mousedown="startDrag($event, 'start')"
        >
        </div>
        <div
            class="c-frame-edit__handle"
            :class="endHandleClass"
            @mousedown="startDrag($event, 'end')"
        ></div>
    </div>
</div>
</template>

<script>

import conditionalStylesMixin from "../mixins/objectStyles-mixin";
import _ from 'lodash';

const START_HANDLE_QUADRANTS = {
    1: 'c-frame-edit__handle--sw',
    2: 'c-frame-edit__handle--se',
    3: 'c-frame-edit__handle--ne',
    4: 'c-frame-edit__handle--nw',
    5: 'c-frame-edit__handle--nw',
    6: 'c-frame-edit__handle--ne'
};

const END_HANDLE_QUADRANTS = {
    1: 'c-frame-edit__handle--ne',
    2: 'c-frame-edit__handle--nw',
    3: 'c-frame-edit__handle--sw',
    4: 'c-frame-edit__handle--se',
    5: 'c-frame-edit__handle--sw',
    6: 'c-frame-edit__handle--nw'
};

export default {
    makeDefinition() {
        return {
            x: 5,
            y: 10,
            x2: 10,
            y2: 5,
            stroke: '#717171'
        };
    },
    mixins: [conditionalStylesMixin],
    inject: ['openmct'],
    props: {
        item: {
            type: Object,
            required: true
        },
        gridSize: {
            type: Array,
            required: true,
            validator: (arr) => arr && arr.length === 2
                && arr.every(el => typeof el === 'number')
        },
        initSelect: Boolean,
        index: {
            type: Number,
            required: true
        },
        multiSelect: Boolean
    },
    data() {
        return {
            dragPosition: undefined,
            dragging: undefined,
            selection: []
        };
    },
    computed: {
        showFrameEdit() {
            let layoutItem = this.selection.length > 0 && this.selection[0][0].context.layoutItem;

            return !this.multiSelect && layoutItem && layoutItem.id === this.item.id;
        },
        position() {
            let {x, y, x2, y2} = this.item;
            if (this.dragging && this.dragPosition) {
                ({x, y, x2, y2} = this.dragPosition);
            }

            return {
                x,
                y,
                x2,
                y2
            };
        },
        stroke() {
            if (this.itemStyle) {
                if (this.itemStyle.border) {
                    return this.itemStyle.border.replace('1px solid ', '');
                }

                return '';
            } else {
                return this.item.stroke;
            }
        },
        style() {
            let {x, y, x2, y2} = this.position;
            let width = Math.max(this.gridSize[0] * Math.abs(x - x2), 1);
            let height = Math.max(this.gridSize[1] * Math.abs(y - y2), 1);
            let left = this.gridSize[0] * Math.min(x, x2);
            let top = this.gridSize[1] * Math.min(y, y2);

            return {
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`
            };
        },
        startHandleClass() {
            return START_HANDLE_QUADRANTS[this.vectorQuadrant];
        },
        endHandleClass() {
            return END_HANDLE_QUADRANTS[this.vectorQuadrant];
        },
        vectorQuadrant() {
            let {x, y, x2, y2} = this.position;
            if (x2 === x) {
                return 5; // Vertical line
            }

            if (y2 === y) {
                return 6; // Horizontal line
            }

            if (x2 > x) {
                if (y2 < y) {
                    return 1;
                }

                return 4;
            }

            if (y2 < y) {
                return 2;
            }

            return 3;
        },
        linePosition() {
            let pos = {};
            switch (this.vectorQuadrant) {
            case 1:
            case 3:
                // slopes up
                pos = {
                    x1: '0%',
                    y1: '100%',
                    x2: '100%',
                    y2: '0%'
                };
                break;
            case 5:
                // vertical
                pos = {
                    x1: '0%',
                    y1: '0%',
                    x2: '0%',
                    y2: '100%'
                };
                break;
            case 6:
                // horizontal
                pos = {
                    x1: '0%',
                    y1: '0%',
                    x2: '100%',
                    y2: '0%'
                };
                break;
            default:
                // slopes down
                pos = {
                    x1: '0%',
                    y1: '0%',
                    x2: '100%',
                    y2: '100%'
                };
                break;
            }

            return pos;
        }
    },
    watch: {
        index(newIndex) {
            if (!this.context) {
                return;
            }

            this.context.index = newIndex;
        },
        item(newItem) {
            if (!this.context) {
                return;
            }

            this.context.layoutItem = newItem;
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.setSelection);
        this.context = {
            layoutItem: this.item,
            index: this.index
        };
        this.removeSelectable = this.openmct.selection.selectable(this.$el, this.context, this.initSelect);
    },
    destroyed() {
        if (this.removeSelectable) {
            this.removeSelectable();
        }

        this.openmct.selection.off('change', this.setSelection);
    },
    methods: {
        startDrag(event, position) {
            this.dragging = position;
            document.body.addEventListener('mousemove', this.continueDrag);
            document.body.addEventListener('mouseup', this.endDrag);
            this.startPosition = [event.pageX, event.pageY];
            let {x, y, x2, y2} = this.item;
            this.dragPosition = {
                x,
                y,
                x2,
                y2
            };
            if (x === x2 || y === y2) {
                if (y > y2 || x < x2) {
                    if (this.dragging === 'start') {
                        this.dragging = 'end';
                    } else if (this.dragging === 'end') {
                        this.dragging = 'start';
                    }
                }
            }

            event.preventDefault();
        },
        continueDrag(event) {
            event.preventDefault();
            let pxDeltaX = this.startPosition[0] - event.pageX;
            let pxDeltaY = this.startPosition[1] - event.pageY;
            let newPosition = this.calculateDragPosition(pxDeltaX, pxDeltaY);

            if (!this.dragging) {
                if (!_.isEqual(newPosition, this.dragPosition)) {
                    let gridDelta = [event.pageX - this.startPosition[0], event.pageY - this.startPosition[1]];
                    this.dragPosition = newPosition;
                    this.$emit('move', this.toGridDelta(gridDelta));
                }
            } else {
                this.dragPosition = newPosition;
            }
        },
        endDrag(event) {
            document.body.removeEventListener('mousemove', this.continueDrag);
            document.body.removeEventListener('mouseup', this.endDrag);
            let {x, y, x2, y2} = this.dragPosition;
            if (!this.dragging) {
                this.$emit('endMove');
            } else {
                this.$emit('endLineResize', this.item, {
                    x,
                    y,
                    x2,
                    y2
                });
            }

            this.dragPosition = undefined;
            this.dragging = undefined;
            event.preventDefault();
        },
        calculateDragPosition(pxDeltaX, pxDeltaY) {
            let gridDeltaX = Math.round(pxDeltaX / this.gridSize[0]);
            let gridDeltaY = Math.round(pxDeltaY / this.gridSize[1]);
            let {x, y, x2, y2} = this.item;
            let dragPosition = {
                x,
                y,
                x2,
                y2
            };

            if (this.dragging === 'start') {
                dragPosition.x -= gridDeltaX;
                dragPosition.y -= gridDeltaY;
            } else if (this.dragging === 'end') {
                dragPosition.x2 -= gridDeltaX;
                dragPosition.y2 -= gridDeltaY;
            } else {
                // dragging entire line.
                dragPosition.x -= gridDeltaX;
                dragPosition.y -= gridDeltaY;
                dragPosition.x2 -= gridDeltaX;
                dragPosition.y2 -= gridDeltaY;
            }

            return dragPosition;
        },
        setSelection(selection) {
            this.selection = selection;
        },
        toGridDelta(pixelDelta) {
            return pixelDelta.map((v, i) => {
                return Math.round(v / this.gridSize[i]);
            });
        }
    }
};
</script>
