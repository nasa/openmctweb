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
<div class="gl-plot-chart-area">
    <span v-html="canvasTemplate"></span>
    <span v-html="canvasTemplate"></span>
</div>
</template>

<script>

import eventHelpers from "../lib/eventHelpers";
import { DrawLoader } from '../draw/DrawLoader';
import MCTChartLineLinear from './MCTChartLineLinear';
import MCTChartLineStepAfter from './MCTChartLineStepAfter';
import MCTChartPointSet from './MCTChartPointSet';
import MCTChartAlarmPointSet from './MCTChartAlarmPointSet';
import configStore from "../configuration/configStore";
import PlotConfigurationModel from "../configuration/PlotConfigurationModel";

const MARKER_SIZE = 6.0;
const HIGHLIGHT_SIZE = MARKER_SIZE * 2.0;

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        rectangles: {
            type: Array,
            default() {
                return [];
            }
        },
        highlights: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            canvasTemplate: '<canvas style="position: absolute; background: none; width: 100%; height: 100%;"></canvas>'
        };
    },
    watch: {
        highlights() {
            this.scheduleDraw();
        },
        rectangles() {
            this.scheduleDraw();
        }
    },
    mounted() {
        eventHelpers.extend(this);

        this.config = this.getConfig();
        this.isDestroyed = false;
        this.lines = [];
        this.pointSets = [];
        this.alarmSets = [];
        this.offset = {};
        this.seriesElements = new WeakMap();

        let canvasEls = this.$parent.$refs.chartContainer.querySelectorAll("canvas");
        const mainCanvas = canvasEls[1];
        const overlayCanvas = canvasEls[0];
        if (this.initializeCanvas(mainCanvas, overlayCanvas)) {
            this.draw();
        }

        this.listenTo(this.config.series, 'add', this.onSeriesAdd, this);
        this.listenTo(this.config.series, 'remove', this.onSeriesRemove, this);
        this.listenTo(this.config.yAxis, 'change:key', this.clearOffset, this);
        this.listenTo(this.config.yAxis, 'change', this.scheduleDraw);
        this.listenTo(this.config.xAxis, 'change', this.scheduleDraw);
        this.config.series.forEach(this.onSeriesAdd, this);
    },
    beforeDestroy() {
        this.destroy();
    },
    methods: {
        getConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (!config) {
                config = new PlotConfigurationModel({
                    id: configId,
                    domainObject: this.domainObject,
                    openmct: this.openmct
                });
                configStore.add(configId, config);
            }

            return config;
        },
        reDraw(mode, o, series) {
            this.changeInterpolate(mode, o, series);
            this.changeMarkers(mode, o, series);
            this.changeAlarmMarkers(mode, o, series);
        },
        onSeriesAdd(series) {
            this.listenTo(series, 'change:xKey', this.reDraw, this);
            this.listenTo(series, 'change:interpolate', this.changeInterpolate, this);
            this.listenTo(series, 'change:markers', this.changeMarkers, this);
            this.listenTo(series, 'change:alarmMarkers', this.changeAlarmMarkers, this);
            this.listenTo(series, 'change', this.scheduleDraw);
            this.listenTo(series, 'add', this.scheduleDraw);
            this.makeChartElement(series);
        },
        changeInterpolate(mode, o, series) {
            if (mode === o) {
                return;
            }

            const elements = this.seriesElements.get(series);
            elements.lines.forEach(function (line) {
                this.lines.splice(this.lines.indexOf(line), 1);
                line.destroy();
            }, this);
            elements.lines = [];

            const newLine = this.lineForSeries(series);
            if (newLine) {
                elements.lines.push(newLine);
                this.lines.push(newLine);
            }
        },
        changeAlarmMarkers(mode, o, series) {
            if (mode === o) {
                return;
            }

            const elements = this.seriesElements.get(series);
            if (elements.alarmSet) {
                elements.alarmSet.destroy();
                this.alarmSets.splice(this.alarmSets.indexOf(elements.alarmSet), 1);
            }

            elements.alarmSet = this.alarmPointSetForSeries(series);
            if (elements.alarmSet) {
                this.alarmSets.push(elements.alarmSet);
            }
        },
        changeMarkers(mode, o, series) {
            if (mode === o) {
                return;
            }

            const elements = this.seriesElements.get(series);
            elements.pointSets.forEach(function (pointSet) {
                this.pointSets.splice(this.pointSets.indexOf(pointSet), 1);
                pointSet.destroy();
            }, this);
            elements.pointSets = [];

            const pointSet = this.pointSetForSeries(series);
            if (pointSet) {
                elements.pointSets.push(pointSet);
                this.pointSets.push(pointSet);
            }
        },
        onSeriesRemove(series) {
            this.stopListening(series);
            this.removeChartElement(series);
            this.scheduleDraw();
        },
        destroy() {
            this.isDestroyed = true;
            this.stopListening();
            this.lines.forEach(line => line.destroy());
            DrawLoader.releaseDrawAPI(this.drawAPI);
        },
        clearOffset() {
            delete this.offset.x;
            delete this.offset.y;
            delete this.offset.xVal;
            delete this.offset.yVal;
            delete this.offset.xKey;
            delete this.offset.yKey;
            this.lines.forEach(function (line) {
                line.reset();
            });
            this.pointSets.forEach(function (pointSet) {
                pointSet.reset();
            });
        },
        setOffset(offsetPoint, index, series) {
            if (this.offset.x && this.offset.y) {
                return;
            }

            const offsets = {
                x: series.getXVal(offsetPoint),
                y: series.getYVal(offsetPoint)
            };

            this.offset.x = function (x) {
                return x - offsets.x;
            }.bind(this);
            this.offset.y = function (y) {
                return y - offsets.y;
            }.bind(this);
            this.offset.xVal = function (point, pSeries) {
                return this.offset.x(pSeries.getXVal(point));
            }.bind(this);
            this.offset.yVal = function (point, pSeries) {
                return this.offset.y(pSeries.getYVal(point));
            }.bind(this);
        },
        initializeCanvas(canvas, overlay) {
            this.canvas = canvas;
            this.overlay = overlay;
            this.drawAPI = DrawLoader.getDrawAPI(canvas, overlay);
            if (this.drawAPI) {
                this.listenTo(this.drawAPI, 'error', this.fallbackToCanvas, this);
            }

            return Boolean(this.drawAPI);
        },
        fallbackToCanvas() {
            this.stopListening(this.drawAPI);
            DrawLoader.releaseDrawAPI(this.drawAPI);
            // Have to throw away the old canvas elements and replace with new
            // canvas elements in order to get new drawing contexts.
            const div = document.createElement('div');
            div.innerHTML = this.TEMPLATE;
            const mainCanvas = div.querySelectorAll("canvas")[1];
            const overlayCanvas = div.querySelectorAll("canvas")[0];
            this.canvas.parentNode.replaceChild(mainCanvas, this.canvas);
            this.canvas = mainCanvas;
            this.overlay.parentNode.replaceChild(overlayCanvas, this.overlay);
            this.overlay = overlayCanvas;
            this.drawAPI = DrawLoader.getFallbackDrawAPI(this.canvas, this.overlay);
            this.$emit('plotReinitializeCanvas');
        },
        removeChartElement(series) {
            const elements = this.seriesElements.get(series);

            elements.lines.forEach(function (line) {
                this.lines.splice(this.lines.indexOf(line), 1);
                line.destroy();
            }, this);
            elements.pointSets.forEach(function (pointSet) {
                this.pointSets.splice(this.pointSets.indexOf(pointSet), 1);
                pointSet.destroy();
            }, this);
            if (elements.alarmSet) {
                elements.alarmSet.destroy();
                this.alarmSets.splice(this.alarmSets.indexOf(elements.alarmSet), 1);
            }

            this.seriesElements.delete(series);
        },
        lineForSeries(series) {
            if (series.get('interpolate') === 'linear') {
                return new MCTChartLineLinear(
                    series,
                    this,
                    this.offset
                );
            }

            if (series.get('interpolate') === 'stepAfter') {
                return new MCTChartLineStepAfter(
                    series,
                    this,
                    this.offset
                );
            }
        },
        pointSetForSeries(series) {
            if (series.get('markers')) {
                return new MCTChartPointSet(
                    series,
                    this,
                    this.offset
                );
            }
        },
        alarmPointSetForSeries(series) {
            if (series.get('alarmMarkers')) {
                return new MCTChartAlarmPointSet(
                    series,
                    this,
                    this.offset
                );
            }
        },
        makeChartElement(series) {
            const elements = {
                lines: [],
                pointSets: []
            };

            const line = this.lineForSeries(series);
            if (line) {
                elements.lines.push(line);
                this.lines.push(line);
            }

            const pointSet = this.pointSetForSeries(series);
            if (pointSet) {
                elements.pointSets.push(pointSet);
                this.pointSets.push(pointSet);
            }

            elements.alarmSet = this.alarmPointSetForSeries(series);
            if (elements.alarmSet) {
                this.alarmSets.push(elements.alarmSet);
            }

            this.seriesElements.set(series, elements);
        },
        canDraw() {
            if (!this.offset.x || !this.offset.y) {
                return false;
            }

            return true;
        },
        scheduleDraw() {
            if (!this.drawScheduled) {
                requestAnimationFrame(this.draw);
                this.drawScheduled = true;
            }
        },
        draw() {
            this.drawScheduled = false;
            if (this.isDestroyed) {
                return;
            }

            this.drawAPI.clear();
            if (this.canDraw()) {
                this.updateViewport();
                this.drawSeries();
                this.drawRectangles();
                this.drawHighlights();
            }
        },
        updateViewport() {
            const xRange = this.config.xAxis.get('displayRange');
            const yRange = this.config.yAxis.get('displayRange');

            if (!xRange || !yRange) {
                return;
            }

            const dimensions = [
                xRange.max - xRange.min,
                yRange.max - yRange.min
            ];

            const origin = [
                this.offset.x(xRange.min),
                this.offset.y(yRange.min)
            ];

            this.drawAPI.setDimensions(
                dimensions,
                origin
            );
        },
        drawSeries() {
            this.lines.forEach(this.drawLine, this);
            this.pointSets.forEach(this.drawPoints, this);
            this.alarmSets.forEach(this.drawAlarmPoints, this);
        },
        drawAlarmPoints(alarmSet) {
            this.drawAPI.drawLimitPoints(
                alarmSet.points,
                alarmSet.series.get('color').asRGBAArray(),
                alarmSet.series.get('markerSize')
            );
        },
        drawPoints(chartElement) {
            this.drawAPI.drawPoints(
                chartElement.getBuffer(),
                chartElement.color().asRGBAArray(),
                chartElement.count,
                chartElement.series.get('markerSize'),
                chartElement.series.get('markerShape')
            );
        },
        drawLine(chartElement) {
            this.drawAPI.drawLine(
                chartElement.getBuffer(),
                chartElement.color().asRGBAArray(),
                chartElement.count
            );
        },
        drawHighlights() {
            if (this.highlights && this.highlights.length) {
                this.highlights.forEach(this.drawHighlight, this);
            }
        },
        drawHighlight(highlight) {
            const points = new Float32Array([
                this.offset.xVal(highlight.point, highlight.series),
                this.offset.yVal(highlight.point, highlight.series)
            ]);

            const color = highlight.series.get('color').asRGBAArray();
            const pointCount = 1;
            const shape = highlight.series.get('markerShape');

            this.drawAPI.drawPoints(points, color, pointCount, HIGHLIGHT_SIZE, shape);
        },
        drawRectangles() {
            if (this.rectangles) {
                this.rectangles.forEach(this.drawRectangle, this);
            }
        },
        drawRectangle(rect) {
            this.drawAPI.drawSquare(
                [
                    this.offset.x(rect.start.x),
                    this.offset.y(rect.start.y)
                ],
                [
                    this.offset.x(rect.end.x),
                    this.offset.y(rect.end.y)
                ],
                rect.color
            );
        }
    }
};

</script>
