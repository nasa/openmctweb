/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
<template>
<div
    ref="axisHolder"
    class="c-conductor-axis"
    @mousedown="dragStart($event)"
>
    <div
        class="c-conductor-axis__zoom-indicator"
        :style="zoomStyle"
    ></div>
</div>
</template>

<script>

import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
import utcMultiTimeFormat from './utcMultiTimeFormat.js';

const PADDING = 1;
const DEFAULT_DURATION_FORMATTER = 'duration';
const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;

export default {
    inject: ['openmct'],
    props: {
        viewBounds: {
            type: Object,
            required: true
        },
        isFixed: {
            type: Boolean,
            required: true
        },
        altPressed: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            inPanMode: false,
            dragStartX: undefined,
            dragX: undefined,
            zoomStyle: {}
        };
    },
    computed: {
        inZoomMode() {
            return !this.inPanMode;
        }
    },
    watch: {
        viewBounds: {
            handler() {
                this.setScale();
            },
            deep: true
        }
    },
    mounted() {
        let vis = d3Selection.select(this.$refs.axisHolder).append("svg:svg");

        this.xAxis = d3Axis.axisTop();
        this.dragging = false;

        // draw x axis with labels. CSS is used to position them.
        this.axisElement = vis.append("g")
            .attr("class", "axis");

        this.setViewFromTimeSystem(this.openmct.time.timeSystem());
        this.setAxisDimensions();
        this.setScale();

        //Respond to changes in conductor
        this.openmct.time.on("timeSystem", this.setViewFromTimeSystem);
        setInterval(this.resize, RESIZE_POLL_INTERVAL);
    },
    methods: {
        setAxisDimensions() {
            const axisHolder = this.$refs.axisHolder;
            const rect = axisHolder.getBoundingClientRect();

            this.left = Math.round(rect.left);
            this.width = axisHolder.clientWidth;
        },
        setScale() {
            if (!this.width) {
                return;
            }

            let timeSystem = this.openmct.time.timeSystem();

            if (timeSystem.isUTCBased) {
                this.xScale.domain(
                    [new Date(this.viewBounds.start), new Date(this.viewBounds.end)]
                );
            } else {
                this.xScale.domain(
                    [this.viewBounds.start, this.viewBounds.end]
                );
            }

            this.xAxis.scale(this.xScale);

            this.xScale.range([PADDING, this.width - PADDING * 2]);
            this.axisElement.call(this.xAxis);

            if (this.width > 1800) {
                this.xAxis.ticks(this.width / PIXELS_PER_TICK_WIDE);
            } else {
                this.xAxis.ticks(this.width / PIXELS_PER_TICK);
            }

            this.msPerPixel = (this.viewBounds.end - this.viewBounds.start) / this.width;
        },
        setViewFromTimeSystem(timeSystem) {
            //The D3 scale used depends on the type of time system as d3
            // supports UTC out of the box.
            if (timeSystem.isUTCBased) {
                this.xScale = d3Scale.scaleUtc();
            } else {
                this.xScale = d3Scale.scaleLinear();
            }

            this.xAxis.scale(this.xScale);
            this.xAxis.tickFormat(utcMultiTimeFormat);
            this.axisElement.call(this.xAxis);
            this.setScale();
        },
        getActiveFormatter() {
            let timeSystem = this.openmct.time.timeSystem();

            if (this.isFixed) {
                return this.getFormatter(timeSystem.timeFormat);
            } else {
                return this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            }
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        dragStart($event) {
            if (this.isFixed) {
                this.dragStartX = $event.clientX;

                if (this.altPressed) {
                    this.inPanMode = true;
                }

                document.addEventListener('mousemove', this.drag);
                document.addEventListener('mouseup', this.dragEnd, {
                    once: true
                });

                if (this.inZoomMode) {
                    this.startZoom();
                }
            }
        },
        drag($event) {
            if (!this.dragging) {
                this.dragging = true;

                requestAnimationFrame(() => {
                    this.dragX = $event.clientX;

                    if (this.inPanMode) {
                        this.pan();
                    } else {
                        this.zoom();
                    }

                    this.dragging = false;
                });
            }
        },
        dragEnd() {
            if (this.inPanMode) {
                this.endPan();
            } else {
                this.endZoom();
            }

            document.removeEventListener('mousemove', this.drag);
            this.dragStartX = undefined;
            this.dragX = undefined;
        },
        pan() {
            const panBounds = this.getPanBounds();
            this.$emit('panAxis', panBounds);
        },
        endPan() {
            const panBounds = this.isChangingViewBounds()
                ? this.getPanBounds()
                : undefined;
            this.$emit('endPan', panBounds);
            this.inPanMode = false;
        },
        getPanBounds() {
            const bounds = this.openmct.time.bounds();
            const deltaTime = bounds.end - bounds.start;
            const deltaX = this.dragX - this.dragStartX;
            const percX = deltaX / this.width;
            const panStart = bounds.start - percX * deltaTime;

            return {
                start: panStart,
                end: panStart + deltaTime
            };
        },
        startZoom() {
            const x = this.scaleToBounds(this.dragStartX);

            this.zoomStyle = {
                left: `${this.dragStartX - this.left}px`
            };

            this.$emit('zoomAxis', {
                start: x,
                end: x
            });
        },
        zoom() {
            const zoomRange = this.getZoomRange();

            this.zoomStyle = {
                left: `${zoomRange.start - this.left}px`,
                width: `${zoomRange.end - zoomRange.start}px`
            };

            this.$emit('zoomAxis', {
                start: this.scaleToBounds(zoomRange.start),
                end: this.scaleToBounds(zoomRange.end)
            });
        },
        endZoom() {
            let zoomBounds;
            if (this.isChangingViewBounds()) {
                const zoomRange = this.getZoomRange();
                zoomBounds = {
                    start: this.scaleToBounds(zoomRange.start),
                    end: this.scaleToBounds(zoomRange.end)
                };
            }

            this.zoomStyle = {};
            this.$emit('endZoom', zoomBounds);
        },
        getZoomRange() {
            const leftBound = this.left;
            const rightBound = this.left + this.width;

            const zoomStart = this.dragX < leftBound
                ? leftBound
                : Math.min(this.dragX, this.dragStartX);

            const zoomEnd = this.dragX > rightBound
                ? rightBound
                : Math.max(this.dragX, this.dragStartX);

            return {
                start: zoomStart,
                end: zoomEnd
            };
        },
        scaleToBounds(value) {
            const bounds = this.openmct.time.bounds();
            const timeDelta = bounds.end - bounds.start;
            const valueDelta = value - this.left;
            const offset = valueDelta / this.width * timeDelta;

            return bounds.start + offset;
        },
        isChangingViewBounds() {
            return this.dragStartX && this.dragX && this.dragStartX !== this.dragX;
        },
        resize() {
            if (this.$refs.axisHolder.clientWidth !== this.width) {
                this.setAxisDimensions();
                this.setScale();
            }
        }
    }

};
</script>
