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

/**
 * Module defining MCTChart. Created by vwoeltje on 11/12/14.
 */
define([
    './MCTChartLineLinear',
    './MCTChartLineStepAfter',
    './MCTChartPointSet',
    './MCTChartAlarmPointSet',
    '../draw/DrawLoader',
    '../lib/eventHelpers'
],
function (
    MCTChartLineLinear,
    MCTChartLineStepAfter,
    MCTChartPointSet,
    MCTChartAlarmPointSet,
    DrawLoader,
    eventHelpers
) {
    const MARKER_SIZE = 6.0;
    const HIGHLIGHT_SIZE = MARKER_SIZE * 2.0;

    /**
     * Offsetter adjusts x and y values by a fixed amount,
     * generally increasing the precision of the 32 bit float representation
     * required for plotting.
     *
     * @constructor
     */
    function MCTChartController($scope) {
        this.$onInit = () => {
            this.$scope = $scope;
            this.isDestroyed = false;
            this.lines = [];
            this.pointSets = [];
            this.alarmSets = [];
            this.offset = {};
            this.config = $scope.config;
            this.listenTo(this.$scope, '$destroy', this.destroy, this);
            this.draw = this.draw.bind(this);
            this.scheduleDraw = this.scheduleDraw.bind(this);
            this.seriesElements = new WeakMap();

            this.listenTo(this.config.series, 'add', this.onSeriesAdd, this);
            this.listenTo(this.config.series, 'remove', this.onSeriesRemove, this);
            this.listenTo(this.config.yAxis, 'change:key', this.clearOffset, this);
            this.listenTo(this.config.yAxis, 'change', this.scheduleDraw);
            this.listenTo(this.config.xAxis, 'change', this.scheduleDraw);
            this.$scope.$watch('highlights', this.scheduleDraw);
            this.$scope.$watch('rectangles', this.scheduleDraw);
            this.config.series.forEach(this.onSeriesAdd, this);
        };
    }

    eventHelpers.extend(MCTChartController.prototype);

    MCTChartController.$inject = ['$scope'];

    MCTChartController.prototype.reDraw = function (mode, o, series) {
        this.changeInterpolate(mode, o, series);
        this.changeMarkers(mode, o, series);
        this.changeAlarmMarkers(mode, o, series);
    };

    MCTChartController.prototype.onSeriesAdd = function (series) {
        this.listenTo(series, 'change:xKey', this.reDraw, this);
        this.listenTo(series, 'change:interpolate', this.changeInterpolate, this);
        this.listenTo(series, 'change:markers', this.changeMarkers, this);
        this.listenTo(series, 'change:alarmMarkers', this.changeAlarmMarkers, this);
        this.listenTo(series, 'change', this.scheduleDraw);
        this.listenTo(series, 'add', this.scheduleDraw);
        this.makeChartElement(series);
    };

    MCTChartController.prototype.changeInterpolate = function (mode, o, series) {
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
    };

    MCTChartController.prototype.changeAlarmMarkers = function (mode, o, series) {
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
    };

    MCTChartController.prototype.changeMarkers = function (mode, o, series) {
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
    };

    MCTChartController.prototype.onSeriesRemove = function (series) {
        this.stopListening(series);
        this.removeChartElement(series);
        this.scheduleDraw();
    };

    MCTChartController.prototype.destroy = function () {
        this.isDestroyed = true;
        this.stopListening();
        this.lines.forEach(line => line.destroy());
        DrawLoader.releaseDrawAPI(this.drawAPI);
    };

    MCTChartController.prototype.clearOffset = function () {
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
    };

    MCTChartController.prototype.setOffset = function (offsetPoint, index, series) {
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
    };

    MCTChartController.prototype.initializeCanvas = function (canvas, overlay) {
        this.canvas = canvas;
        this.overlay = overlay;
        this.drawAPI = DrawLoader.getDrawAPI(canvas, overlay);
        if (this.drawAPI) {
            this.listenTo(this.drawAPI, 'error', this.fallbackToCanvas, this);
        }

        return Boolean(this.drawAPI);
    };

    MCTChartController.prototype.fallbackToCanvas = function () {
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
        this.$scope.$emit('plot:reinitializeCanvas');
    };

    MCTChartController.prototype.removeChartElement = function (series) {
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
    };

    MCTChartController.prototype.lineForSeries = function (series) {
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
    };

    MCTChartController.prototype.pointSetForSeries = function (series) {
        if (series.get('markers')) {
            return new MCTChartPointSet(
                series,
                this,
                this.offset
            );
        }
    };

    MCTChartController.prototype.alarmPointSetForSeries = function (series) {
        if (series.get('alarmMarkers')) {
            return new MCTChartAlarmPointSet(
                series,
                this,
                this.offset
            );
        }
    };

    MCTChartController.prototype.makeChartElement = function (series) {
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
    };

    MCTChartController.prototype.canDraw = function () {
        if (!this.offset.x || !this.offset.y) {
            return false;
        }

        return true;
    };

    MCTChartController.prototype.scheduleDraw = function () {
        if (!this.drawScheduled) {
            requestAnimationFrame(this.draw);
            this.drawScheduled = true;
        }
    };

    MCTChartController.prototype.draw = function () {
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
    };

    MCTChartController.prototype.updateViewport = function () {
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
    };

    MCTChartController.prototype.drawSeries = function () {
        this.lines.forEach(this.drawLine, this);
        this.pointSets.forEach(this.drawPoints, this);
        this.alarmSets.forEach(this.drawAlarmPoints, this);
    };

    MCTChartController.prototype.drawAlarmPoints = function (alarmSet) {
        this.drawAPI.drawLimitPoints(
            alarmSet.points,
            alarmSet.series.get('color').asRGBAArray(),
            alarmSet.series.get('markerSize')
        );
    };

    MCTChartController.prototype.drawPoints = function (chartElement) {
        this.drawAPI.drawPoints(
            chartElement.getBuffer(),
            chartElement.color().asRGBAArray(),
            chartElement.count,
            chartElement.series.get('markerSize'),
            chartElement.series.get('markerShape')
        );
    };

    MCTChartController.prototype.drawLine = function (chartElement) {
        this.drawAPI.drawLine(
            chartElement.getBuffer(),
            chartElement.color().asRGBAArray(),
            chartElement.count
        );
    };

    MCTChartController.prototype.drawHighlights = function () {
        if (this.$scope.highlights && this.$scope.highlights.length) {
            this.$scope.highlights.forEach(this.drawHighlight, this);
        }
    };

    MCTChartController.prototype.drawHighlight = function (highlight) {
        const points = new Float32Array([
            this.offset.xVal(highlight.point, highlight.series),
            this.offset.yVal(highlight.point, highlight.series)
        ]);

        const color = highlight.series.get('color').asRGBAArray();
        const pointCount = 1;
        const shape = highlight.series.get('markerShape');

        this.drawAPI.drawPoints(points, color, pointCount, HIGHLIGHT_SIZE, shape);
    };

    MCTChartController.prototype.drawRectangles = function () {
        if (this.$scope.rectangles) {
            this.$scope.rectangles.forEach(this.drawRectangle, this);
        }
    };

    MCTChartController.prototype.drawRectangle = function (rect) {
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
    };

    return MCTChartController;
});
