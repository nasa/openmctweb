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
<div v-if="loaded"
     class="gl-plot"
     :class="[plotLegendExpandedStateClass, plotLegendPositionClass]"
>
    <plot-legend :cursor-locked="!!lockHighlightPoint"
                 :series="config.series.models"
                 :highlights="highlights"
                 :legend="config.legend"
    />
    <div class="plot-wrapper-axis-and-display-area flex-elem grows">
        <y-axis v-if="config.series.models.length > 0"
                :tick-width="tickWidth"
                :single-series="config.series.models.length === 1"
                :series-model="config.series.models[0]"
                @yKeyChanged="setYAxisKey"
                @tickWidthChanged="onTickWidthChange"
        />
        <div class="gl-plot-wrapper-display-area-and-x-axis"
             :style="{
                 left: (tickWidth + 20) + 'px'
             }"
        >

            <div class="gl-plot-display-area has-local-controls has-cursor-guides">
                <div class="l-state-indicators">
                    <span class="l-state-indicators__alert-no-lad t-object-alert t-alert-unsynced icon-alert-triangle"
                          title="This plot is not currently displaying the latest data. Reset pan/zoom to view latest data."
                    ></span>
                </div>

                <mct-ticks v-show="gridLines && !options.compact"
                           :axis-type="'xAxis'"
                           :position="'right'"
                           @plotTickWidth="onTickWidthChange"
                />

                <mct-ticks v-show="gridLines"
                           :axis-type="'yAxis'"
                           :position="'bottom'"
                           @plotTickWidth="onTickWidthChange"
                />

                <div ref="chartContainer"
                     class="gl-plot-chart-wrapper"
                >
                    <mct-chart :series-config="config"
                               :rectangles="rectangles"
                               :highlights="highlights"
                               @plotReinitializeCanvas="initCanvas"
                    />
                </div>

                <div class="gl-plot__local-controls h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover">
                    <div class="c-button-set c-button-set--strip-h">
                        <button class="c-button icon-minus"
                                title="Zoom out"
                                @click="zoom('out', 0.2)"
                        >
                        </button>
                        <button class="c-button icon-plus"
                                title="Zoom in"
                                @click="zoom('in', 0.2)"
                        >
                        </button>
                    </div>
                    <div class="c-button-set c-button-set--strip-h"
                         :disabled="!plotHistory.length"
                    >
                        <button class="c-button icon-arrow-left"
                                title="Restore previous pan/zoom"
                                @click="back()"
                        >
                        </button>
                        <button class="c-button icon-reset"
                                title="Reset pan/zoom"
                                @click="clear()"
                        >
                        </button>
                    </div>
                </div>

                <!--Cursor guides-->
                <div v-show="cursorGuide"
                     ref="cursorGuideVertical"
                     class="c-cursor-guide--v js-cursor-guide--v"
                >
                </div>
                <div v-show="cursorGuide"
                     ref="cursorGuideHorizontal"
                     class="c-cursor-guide--h js-cursor-guide--h"
                >
                </div>
            </div>
            <x-axis v-if="config.series.models.length > 0 && !options.compact"
                    :series-model="config.series.models[0]"
            />

        </div>
    </div>

</div>
</template>

<script>

import eventHelpers from './lib/eventHelpers';
import LinearScale from "./LinearScale";
import PlotConfigurationModel from './configuration/PlotConfigurationModel';
import configStore from './configuration/configStore';

import PlotLegend from "./legend/PlotLegend.vue";
import MctTicks from "./MctTicks.vue";
import MctChart from "./chart/MctChart.vue";
import XAxis from "./axis/XAxis.vue";
import YAxis from "./axis/YAxis.vue";

export default {
    components: {
        XAxis,
        YAxis,
        PlotLegend,
        MctTicks,
        MctChart
    },
    inject: ['openmct', 'domainObject'],
    props: {
        options: {
            type: Object,
            default() {
                return {
                    compact: false
                };
            }
        },
        gridLines: {
            type: Boolean,
            default() {
                return true;
            }
        },
        cursorGuide: {
            type: Boolean,
            default() {
                return true;
            }
        },
        plotTickWidth: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    data() {
        return {
            highlights: [],
            lockHighlightPoint: false,
            tickWidth: 0,
            yKeyOptions: [],
            yAxisLabel: '',
            rectangles: [],
            plotHistory: [],
            selectedXKeyOption: {},
            xKeyOptions: [],
            config: {},
            pending: 0,
            loaded: false
        };
    },
    computed: {
        plotLegendPositionClass() {
            return `plot-legend-${this.config.legend.get('position')}`;
        },
        plotLegendExpandedStateClass() {
            if (this.config.legend.get('expanded')) {
                return 'plot-legend-expanded';
            } else {
                return 'plot-legend-collapsed';
            }
        }
    },
    watch: {
        plotTickWidth(newTickWidth) {
            this.onTickWidthChange(newTickWidth, true);
        },
        gridLines(newGridLines) {
            this.setGridLinesVisibility(newGridLines);
        },
        cursorGuide(newCursorGuide) {
            this.setCursorGuideVisibility(newCursorGuide);
        }
    },
    mounted() {
        eventHelpers.extend(this);

        this.config = this.getConfig();

        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);

        this.config.series.models.forEach(this.addSeries, this);

        this.filterObserver = this.openmct.objects.observe(
            this.domainObject,
            'configuration.filters',
            this.updateFiltersAndResubscribe
        );

        this.openmct.objectViews.on('clearData', this.clearData);
        this.followTimeConductor();

        this.loaded = true;

        //We're referencing the canvas elements from the mct-chart in the initialize method.
        // So we need $nextTick to ensure the component is fully mounted before we can initialize stuff.
        this.$nextTick(this.initialize);

    },
    beforeDestroy() {
        this.destroy();
    },
    methods: {
        followTimeConductor() {
            this.openmct.time.on('bounds', this.updateDisplayBounds);
            this.synchronized(true);
        },
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
        addSeries(series) {
            this.listenTo(series, 'change:xKey', (xKey) => {
                this.setDisplayRange(series, xKey);
            }, this);
            this.listenTo(series, 'change:yKey', () => {
                this.loadSeriesData(series);
            }, this);

            this.listenTo(series, 'change:interpolate', () => {
                this.loadSeriesData(series);
            }, this);

            this.loadSeriesData(series);
        },

        removeSeries(plotSeries) {
            this.stopListening(plotSeries);
        },

        loadSeriesData(series) {
            if (this.$parent.$refs.plotWrapper.offsetWidth === 0) {
                this.scheduleLoad(series);

                return;
            }

            this.startLoading();
            const options = {
                size: this.$parent.$refs.plotWrapper.offsetWidth,
                domain: this.config.xAxis.get('key')
            };

            series.load(options)
                .then(this.stopLoading.bind(this));
        },

        loadMoreData(range, purge) {
            this.config.series.forEach(plotSeries => {
                this.startLoading();
                plotSeries.load({
                    size: this.$parent.$refs.plotWrapper.offsetWidth,
                    start: range.min,
                    end: range.max,
                    domain: this.config.xAxis.get('key')
                })
                    .then(this.stopLoading());
                if (purge) {
                    plotSeries.purgeRecordsOutsideRange(range);
                }
            });
        },

        scheduleLoad(series) {
            if (!this.scheduledLoads) {
                this.startLoading();
                this.scheduledLoads = [];
                this.checkForSize = setInterval(function () {
                    if (this.$parent.$refs.plotWrapper.offsetWidth === 0) {
                        return;
                    }

                    this.stopLoading();
                    this.scheduledLoads.forEach(this.loadSeriesData, this);
                    delete this.scheduledLoads;
                    clearInterval(this.checkForSize);
                    delete this.checkForSize;
                }.bind(this));
            }

            if (this.scheduledLoads.indexOf(series) === -1) {
                this.scheduledLoads.push(series);
            }
        },

        startLoading() {
            this.pending += 1;
            this.updateLoading();
        },

        stopLoading() {
        //TODO: Is Vue.$nextTick ok to replace $scope.$evalAsync?
            this.$nextTick().then(() => {
                this.pending -= 1;
                this.updateLoading();
            });
        },

        updateLoading() {
            this.$emit('loadingUpdated', this.pending > 0);
        },

        updateFiltersAndResubscribe(updatedFilters) {
            this.config.series.forEach(function (series) {
                series.updateFiltersAndRefresh(updatedFilters[series.keyString]);
            });
        },

        clearData() {
            this.config.series.forEach(function (series) {
                series.reset();
            });
        },

        setDisplayRange(series, xKey) {
            if (this.config.series.length !== 1) {
                return;
            }

            const displayRange = series.getDisplayRange(xKey);
            this.config.xAxis.set('range', displayRange);
        },

        /**
       * Track latest display bounds.  Forces update when not receiving ticks.
       */
        updateDisplayBounds(bounds, isTick) {
            const newRange = {
                min: bounds.start,
                max: bounds.end
            };
            this.config.xAxis.set('range', newRange);
            if (!isTick) {
                this.skipReloadOnInteraction = true;
                this.clear();
                this.skipReloadOnInteraction = false;
                this.loadMoreData(newRange, true);
            } else {
                // Drop any data that is more than 1x (max-min) before min.
                // Limit these purges to once a second.
                if (!this.nextPurge || this.nextPurge < Date.now()) {
                    const keepRange = {
                        min: newRange.min - (newRange.max - newRange.min),
                        max: newRange.max
                    };
                    this.config.series.forEach(function (series) {
                        series.purgeRecordsOutsideRange(keepRange);
                    });
                    this.nextPurge = Date.now() + 1000;
                }
            }
        },

        /**
       * Handle end of user viewport change: load more data for current display
       * bounds, and mark view as synchronized if bounds match configured bounds.
       */
        userViewportChangeEnd() {
            const xDisplayRange = this.config.xAxis.get('displayRange');
            const xRange = this.config.xAxis.get('range');

            if (!this.skipReloadOnInteraction) {
                this.loadMoreData(xDisplayRange);
            }

            this.synchronized(xRange.min === xDisplayRange.min
            && xRange.max === xDisplayRange.max);
        },

        /**
       * Getter/setter for "synchronized" value.  If not synchronized and
       * time conductor is in clock mode, will mark objects as unsynced so that
       * displays can update accordingly.
       */
        synchronized(value) {
            if (typeof value !== 'undefined') {
                this._synchronized = value;
                const isUnsynced = !value && this.openmct.time.clock();
                const domainObject = this.openmct.legacyObject(this.domainObject);
                if (domainObject.getCapability('status')) {
                    domainObject.getCapability('status')
                        .set('timeconductor-unsynced', isUnsynced);
                }
            }

            return this._synchronized;
        },

        initCanvas() {
            if (this.canvas) {
                this.stopListening(this.canvas);
            }

            this.canvas = this.$refs.chartContainer.querySelectorAll('canvas')[1];

            this.listenTo(this.canvas, 'mousemove', this.trackMousePosition, this);
            this.listenTo(this.canvas, 'mouseleave', this.untrackMousePosition, this);
            this.listenTo(this.canvas, 'mousedown', this.onMouseDown, this);
            this.listenTo(this.canvas, 'wheel', this.wheelZoom, this);
        },

        initialize() {
            // Setup canvas etc.
            this.xScale = new LinearScale(this.config.xAxis.get('displayRange'));
            this.yScale = new LinearScale(this.config.yAxis.get('displayRange'));

            this.pan = undefined;
            this.marquee = undefined;

            this.chartElementBounds = undefined;
            this.tickUpdate = false;

            this.canvas = this.$refs.chartContainer.querySelectorAll('canvas')[1];

            this.listenTo(this.canvas, 'mousemove', this.trackMousePosition, this);
            this.listenTo(this.canvas, 'mouseleave', this.untrackMousePosition, this);
            this.listenTo(this.canvas, 'mousedown', this.onMouseDown, this);
            this.listenTo(this.canvas, 'wheel', this.wheelZoom, this);

            this.config.yAxisLabel = this.config.yAxis.get('label');

            this.cursorGuideVertical = this.$refs.cursorGuideVertical;
            this.cursorGuideHorizontal = this.$refs.cursorGuideHorizontal;

            this.listenTo(this.config.xAxis, 'change:displayRange', this.onXAxisChange, this);
            this.listenTo(this.config.yAxis, 'change:displayRange', this.onYAxisChange, this);
        },

        onXAxisChange(displayBounds) {
            if (displayBounds) {
                this.xScale.domain(displayBounds);
            }
        },

        onYAxisChange(displayBounds) {
            if (displayBounds) {
                this.yScale.domain(displayBounds);
            }
        },

        onTickWidthChange(width, fromDifferentObject) {
            if (fromDifferentObject) {
                // Always accept tick width if it comes from a different object.
                this.tickWidth = width;
            } else {
                // Otherwise, only accept tick with if it's larger.
                const newWidth = Math.max(width, this.tickWidth);
                if (newWidth !== this.tickWidth) {
                    this.tickWidth = newWidth;
                }
            }

            this.$emit('plotTickWidth', this.tickWidth);
        },

        trackMousePosition(event) {
            this.trackChartElementBounds(event);
            this.xScale.range({
                min: 0,
                max: this.chartElementBounds.width
            });
            this.yScale.range({
                min: 0,
                max: this.chartElementBounds.height
            });

            this.positionOverElement = {
                x: event.clientX - this.chartElementBounds.left,
                y: this.chartElementBounds.height
              - (event.clientY - this.chartElementBounds.top)
            };

            this.positionOverPlot = {
                x: this.xScale.invert(this.positionOverElement.x),
                y: this.yScale.invert(this.positionOverElement.y)
            };

            if (this.cursorGuide) {
                this.updateCrosshairs(event);
            }

            this.highlightValues(this.positionOverPlot.x);
            this.updateMarquee();
            this.updatePan();
            event.preventDefault();
        },

        updateCrosshairs(event) {
            this.cursorGuideVertical.style.left = (event.clientX - this.chartElementBounds.x) + 'px';
            this.cursorGuideHorizontal.style.top = (event.clientY - this.chartElementBounds.y) + 'px';
        },

        trackChartElementBounds(event) {
            if (event.target === this.canvas) {
                this.chartElementBounds = event.target.getBoundingClientRect();
            }
        },

        onPlotHighlightSet($e, point) {
            if (point === this.highlightPoint) {
                return;
            }

            this.highlightValues(point);
        },

        highlightValues(point) {
            this.highlightPoint = point;
            // TODO: used in StackedPlotController
            this.$emit('plotHighlightUpdate', point);
            if (this.lockHighlightPoint) {
                return;
            }

            if (!point) {
                this.highlights = [];
                this.config.series.models.forEach(series => delete series.closest);
            } else {
                this.highlights = this.config.series.models
                    .filter(series => series.data.length > 0)
                    .map(series => {
                        series.closest = series.nearestPoint(point);

                        return {
                            series: series,
                            point: series.closest
                        };
                    });
            }
        },

        untrackMousePosition() {
            this.positionOverElement = undefined;
            this.positionOverPlot = undefined;
            this.highlightValues();
        },

        onMouseDown(event) {
        // do not monitor drag events on browser context click
            if (event.ctrlKey) {
                return;
            }

            this.listenTo(window, 'mouseup', this.onMouseUp, this);
            this.listenTo(window, 'mousemove', this.trackMousePosition, this);
            if (event.altKey) {
                return this.startPan(event);
            } else {
                return this.startMarquee(event);
            }
        },

        onMouseUp(event) {
            this.stopListening(window, 'mouseup', this.onMouseUp, this);
            this.stopListening(window, 'mousemove', this.trackMousePosition, this);

            if (this.isMouseClick()) {
                this.lockHighlightPoint = !this.lockHighlightPoint;
            }

            if (this.pan) {
                return this.endPan(event);
            }

            if (this.marquee) {
                return this.endMarquee(event);
            }
        },

        isMouseClick() {
            if (!this.marquee) {
                return false;
            }

            const { start, end } = this.marquee;

            return start.x === end.x && start.y === end.y;
        },

        updateMarquee() {
            if (!this.marquee) {
                return;
            }

            this.marquee.end = this.positionOverPlot;
            this.marquee.endPixels = this.positionOverElement;
        },

        startMarquee(event) {
            this.canvas.classList.remove('plot-drag');
            this.canvas.classList.add('plot-marquee');

            this.trackMousePosition(event);
            if (this.positionOverPlot) {
                this.freeze();
                this.marquee = {
                    startPixels: this.positionOverElement,
                    endPixels: this.positionOverElement,
                    start: this.positionOverPlot,
                    end: this.positionOverPlot,
                    color: [1, 1, 1, 0.5]
                };
                this.rectangles.push(this.marquee);
                this.trackHistory();
            }
        },

        endMarquee() {
            const startPixels = this.marquee.startPixels;
            const endPixels = this.marquee.endPixels;
            const marqueeDistance = Math.sqrt(
                Math.pow(startPixels.x - endPixels.x, 2)
            + Math.pow(startPixels.y - endPixels.y, 2)
            );
            // Don't zoom if mouse moved less than 7.5 pixels.
            if (marqueeDistance > 7.5) {
                this.config.xAxis.set('displayRange', {
                    min: Math.min(this.marquee.start.x, this.marquee.end.x),
                    max: Math.max(this.marquee.start.x, this.marquee.end.x)
                });
                this.config.yAxis.set('displayRange', {
                    min: Math.min(this.marquee.start.y, this.marquee.end.y),
                    max: Math.max(this.marquee.start.y, this.marquee.end.y)
                });
                this.userViewportChangeEnd();
            } else {
                // A history entry is created by startMarquee, need to remove
                // if marquee zoom doesn't occur.
                this.plotHistory.pop();
            }

            this.rectangles = [];
            this.marquee = undefined;
        },

        zoom(zoomDirection, zoomFactor) {
            const currentXaxis = this.config.xAxis.get('displayRange');
            const currentYaxis = this.config.yAxis.get('displayRange');

            // when there is no plot data, the ranges can be undefined
            // in which case we should not perform zoom
            if (!currentXaxis || !currentYaxis) {
                return;
            }

            this.freeze();
            this.trackHistory();

            const xAxisDist = (currentXaxis.max - currentXaxis.min) * zoomFactor;
            const yAxisDist = (currentYaxis.max - currentYaxis.min) * zoomFactor;

            if (zoomDirection === 'in') {
                this.config.xAxis.set('displayRange', {
                    min: currentXaxis.min + xAxisDist,
                    max: currentXaxis.max - xAxisDist
                });

                this.config.yAxis.set('displayRange', {
                    min: currentYaxis.min + yAxisDist,
                    max: currentYaxis.max - yAxisDist
                });
            } else if (zoomDirection === 'out') {
                this.config.xAxis.set('displayRange', {
                    min: currentXaxis.min - xAxisDist,
                    max: currentXaxis.max + xAxisDist
                });

                this.config.yAxis.set('displayRange', {
                    min: currentYaxis.min - yAxisDist,
                    max: currentYaxis.max + yAxisDist
                });
            }

            this.userViewportChangeEnd();
        },

        wheelZoom(event) {
            const ZOOM_AMT = 0.1;
            event.preventDefault();

            if (!this.positionOverPlot) {
                return;
            }

            let xDisplayRange = this.config.xAxis.get('displayRange');
            let yDisplayRange = this.config.yAxis.get('displayRange');

            // when there is no plot data, the ranges can be undefined
            // in which case we should not perform zoom
            if (!xDisplayRange || !yDisplayRange) {
                return;
            }

            this.freeze();
            window.clearTimeout(this.stillZooming);

            let xAxisDist = (xDisplayRange.max - xDisplayRange.min);
            let yAxisDist = (yDisplayRange.max - yDisplayRange.min);
            let xDistMouseToMax = xDisplayRange.max - this.positionOverPlot.x;
            let xDistMouseToMin = this.positionOverPlot.x - xDisplayRange.min;
            let yDistMouseToMax = yDisplayRange.max - this.positionOverPlot.y;
            let yDistMouseToMin = this.positionOverPlot.y - yDisplayRange.min;
            let xAxisMaxDist = xDistMouseToMax / xAxisDist;
            let xAxisMinDist = xDistMouseToMin / xAxisDist;
            let yAxisMaxDist = yDistMouseToMax / yAxisDist;
            let yAxisMinDist = yDistMouseToMin / yAxisDist;

            let plotHistoryStep;

            if (!plotHistoryStep) {
                plotHistoryStep = {
                    x: xDisplayRange,
                    y: yDisplayRange
                };
            }

            if (event.wheelDelta < 0) {

                this.config.xAxis.set('displayRange', {
                    min: xDisplayRange.min + ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                    max: xDisplayRange.max - ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
                });

                this.config.yAxis.set('displayRange', {
                    min: yDisplayRange.min + ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                    max: yDisplayRange.max - ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
                });
            } else if (event.wheelDelta >= 0) {

                this.config.xAxis.set('displayRange', {
                    min: xDisplayRange.min - ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                    max: xDisplayRange.max + ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
                });

                this.config.yAxis.set('displayRange', {
                    min: yDisplayRange.min - ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                    max: yDisplayRange.max + ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
                });
            }

            this.stillZooming = window.setTimeout(function () {
                this.plotHistory.push(plotHistoryStep);
                plotHistoryStep = undefined;
                this.userViewportChangeEnd();
            }.bind(this), 250);
        },

        startPan(event) {
            this.canvas.classList.add('plot-drag');
            this.canvas.classList.remove('plot-marquee');

            this.trackMousePosition(event);
            this.freeze();
            this.pan = {
                start: this.positionOverPlot
            };
            event.preventDefault();
            this.trackHistory();

            return false;
        },

        updatePan() {
        // calculate offset between points.  Apply that offset to viewport.
            if (!this.pan) {
                return;
            }

            const dX = this.pan.start.x - this.positionOverPlot.x;
            const dY = this.pan.start.y - this.positionOverPlot.y;
            const xRange = this.config.xAxis.get('displayRange');
            const yRange = this.config.yAxis.get('displayRange');

            this.config.xAxis.set('displayRange', {
                min: xRange.min + dX,
                max: xRange.max + dX
            });
            this.config.yAxis.set('displayRange', {
                min: yRange.min + dY,
                max: yRange.max + dY
            });
        },

        trackHistory() {
            this.plotHistory.push({
                x: this.config.xAxis.get('displayRange'),
                y: this.config.yAxis.get('displayRange')
            });
        },

        endPan() {
            this.pan = undefined;
            this.userViewportChangeEnd();
        },

        freeze() {
            this.config.yAxis.set('frozen', true);
            this.config.xAxis.set('frozen', true);
        },

        clear() {
            this.config.yAxis.set('frozen', false);
            this.config.xAxis.set('frozen', false);
            this.plotHistory = [];
            this.userViewportChangeEnd();
        },

        back() {
            const previousAxisRanges = this.plotHistory.pop();
            if (this.plotHistory.length === 0) {
                this.clear();

                return;
            }

            this.config.xAxis.set('displayRange', previousAxisRanges.x);
            this.config.yAxis.set('displayRange', previousAxisRanges.y);
            this.userViewportChangeEnd();
        },

        setCursorGuideVisibility(cursorGuide) {
            this.cursorGuide = cursorGuide === true;
        },

        setGridLinesVisibility(gridLines) {
            this.gridLines = gridLines === true;
        },

        setYAxisKey(yKey) {
            this.config.series.models[0].emit('change:yKey', yKey);
        },

        destroy() {
            configStore.deleteStore(this.config.id);

            this.stopListening();
            if (this.checkForSize) {
                clearInterval(this.checkForSize);
                delete this.checkForSize;
            }

            if (this.filterObserver) {
                this.filterObserver();
            }

            this.openmct.time.off('bounds', this.updateDisplayBounds);
            this.openmct.objectViews.off('clearData', this.clearData);
        }
    }
};

</script>
