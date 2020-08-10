/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    './LinearScale',
    '../lib/eventHelpers'
], function (
    LinearScale,
    eventHelpers
) {

    /**
     * MCTPlotController handles user interactions with the plot canvas.
     * It supports pan and zoom, implements zoom history, and supports locating
     * values near the cursor.
     */
    function MCTPlotController($scope, $element, $window) {
        this.$onInit = () => {
            this.$scope = $scope;
            this.$scope.config = this.config;
            this.$scope.plot = this;
            this.$element = $element;
            this.$window = $window;

            this.xScale = new LinearScale(this.config.xAxis.get('displayRange'));
            this.yScale = new LinearScale(this.config.yAxis.get('displayRange'));

            this.pan = undefined;
            this.marquee = undefined;

            this.chartElementBounds = undefined;
            this.tickUpdate = false;

            this.$scope.plotHistory = this.plotHistory = [];
            this.listenTo(this.$scope, 'plot:clearHistory', this.clear, this);

            this.initialize();
        };
    }

    MCTPlotController.$inject = ['$scope', '$element', '$window'];

    eventHelpers.extend(MCTPlotController.prototype);

    MCTPlotController.prototype.initCanvas = function () {
        if (this.$canvas) {
            this.stopListening(this.$canvas);
        }

        this.$canvas = this.$element.find('canvas');

        this.listenTo(this.$canvas, 'mousemove', this.trackMousePosition, this);
        this.listenTo(this.$canvas, 'mouseleave', this.untrackMousePosition, this);
        this.listenTo(this.$canvas, 'mousedown', this.onMouseDown, this);
        this.listenTo(this.$canvas, 'wheel', this.wheelZoom, this);
    };

    MCTPlotController.prototype.initialize = function () {
        this.$canvas = this.$element.find('canvas');

        this.listenTo(this.$canvas, 'mousemove', this.trackMousePosition, this);
        this.listenTo(this.$canvas, 'mouseleave', this.untrackMousePosition, this);
        this.listenTo(this.$canvas, 'mousedown', this.onMouseDown, this);
        this.listenTo(this.$canvas, 'wheel', this.wheelZoom, this);

        this.$scope.rectangles = [];
        this.$scope.tickWidth = 0;

        this.$scope.xAxis = this.config.xAxis;
        this.$scope.yAxis = this.config.yAxis;
        this.$scope.series = this.config.series.models;
        this.$scope.legend = this.config.legend;

        this.$scope.yAxisLabel = this.config.yAxis.get('label');

        this.cursorGuideVertical = this.$element[0].querySelector('.js-cursor-guide--v');
        this.cursorGuideHorizontal = this.$element[0].querySelector('.js-cursor-guide--h');
        this.cursorGuide = false;

        this.listenTo(this.$scope, 'cursorguide', this.toggleCursorGuide, this);

        this.listenTo(this.$scope, '$destroy', this.destroy, this);
        this.listenTo(this.$scope, 'plot:tickWidth', this.onTickWidthChange, this);
        this.listenTo(this.$scope, 'plot:highlight:set', this.onPlotHighlightSet, this);
        this.listenTo(this.$scope, 'plot:reinitializeCanvas', this.initCanvas, this);
        this.listenTo(this.config.xAxis, 'change:displayRange', this.onXAxisChange, this);
        this.listenTo(this.config.yAxis, 'change:displayRange', this.onYAxisChange, this);

        this.setUpYAxisOptions();
    };

    MCTPlotController.prototype.setUpYAxisOptions = function () {
        if (this.$scope.series.length === 1) {
            let metadata = this.$scope.series[0].metadata;

            this.$scope.yKeyOptions = metadata
                .valuesForHints(['range'])
                .map(function (o) {
                    return {
                        name: o.name,
                        key: o.key
                    };
                });

            //  set yAxisLabel if none is set yet
            if (this.$scope.yAxisLabel === 'none') {
                let yKey = this.$scope.series[0].model.yKey,
                    yKeyModel = this.$scope.yKeyOptions.filter(o => o.key === yKey)[0];

                this.$scope.yAxisLabel = yKeyModel.name;
            }
        } else {
            this.$scope.yKeyOptions = undefined;
        }
    };

    MCTPlotController.prototype.onXAxisChange = function (displayBounds) {
        if (displayBounds) {
            this.xScale.domain(displayBounds);
        }
    };

    MCTPlotController.prototype.onYAxisChange = function (displayBounds) {
        if (displayBounds) {
            this.yScale.domain(displayBounds);
        }
    };

    MCTPlotController.prototype.onTickWidthChange = function ($event, width) {
        if ($event.targetScope.domainObject !== this.$scope.domainObject) {
            // Always accept tick width if it comes from a different object.
            this.$scope.tickWidth = width;
        } else {
            // Otherwise, only accept tick with if it's larger.
            var newWidth = Math.max(width, this.$scope.tickWidth);
            if (newWidth !== this.$scope.tickWidth) {
                this.$scope.tickWidth = newWidth;
                this.$scope.$digest();
            }
        }
    };

    MCTPlotController.prototype.trackMousePosition = function ($event) {
        this.trackChartElementBounds($event);
        this.xScale.range({
            min: 0,
            max: this.chartElementBounds.width
        });
        this.yScale.range({
            min: 0,
            max: this.chartElementBounds.height
        });

        this.positionOverElement = {
            x: $event.clientX - this.chartElementBounds.left,
            y: this.chartElementBounds.height
                - ($event.clientY - this.chartElementBounds.top)
        };

        this.positionOverPlot = {
            x: this.xScale.invert(this.positionOverElement.x),
            y: this.yScale.invert(this.positionOverElement.y)
        };

        if (this.cursorGuide) {
            this.updateCrosshairs($event);
        }

        this.highlightValues(this.positionOverPlot.x);
        this.updateMarquee();
        this.updatePan();
        this.$scope.$digest();
        $event.preventDefault();
    };

    MCTPlotController.prototype.updateCrosshairs = function ($event) {
        this.cursorGuideVertical.style.left = ($event.clientX - this.chartElementBounds.x) + 'px';
        this.cursorGuideHorizontal.style.top = ($event.clientY - this.chartElementBounds.y) + 'px';
    };

    MCTPlotController.prototype.trackChartElementBounds = function ($event) {
        if ($event.target === this.$canvas[1]) {
            this.chartElementBounds = $event.target.getBoundingClientRect();
        }
    };

    MCTPlotController.prototype.onPlotHighlightSet = function ($e, point) {
        if (point === this.highlightPoint) {
            return;
        }

        this.highlightValues(point);
    };

    MCTPlotController.prototype.highlightValues = function (point) {
        this.highlightPoint = point;
        this.$scope.$emit('plot:highlight:update', point);
        if (this.$scope.lockHighlightPoint) {
            return;
        }

        if (!point) {
            this.$scope.highlights = [];
            this.$scope.series.map(function (series) {
                delete series.closest;
            });
        } else {
            this.$scope.highlights = this.$scope.series
                .filter(function (series) {
                    return series.data.length > 0;
                }).map(function (series) {
                    series.closest = series.nearestPoint(point);

                    return {
                        series: series,
                        point: series.closest
                    };
                }, this);
        }

        this.$scope.$digest();
    };

    MCTPlotController.prototype.untrackMousePosition = function () {
        this.positionOverElement = undefined;
        this.positionOverPlot = undefined;
        this.highlightValues();
    };

    MCTPlotController.prototype.onMouseDown = function ($event) {
        // do not monitor drag events on browser context click
        if (event.ctrlKey) {
            return;
        }

        this.listenTo(this.$window, 'mouseup', this.onMouseUp, this);
        this.listenTo(this.$window, 'mousemove', this.trackMousePosition, this);
        if (event.altKey) {
            return this.startPan($event);
        } else {
            return this.startMarquee($event);
        }
    };

    MCTPlotController.prototype.onMouseUp = function ($event) {
        this.stopListening(this.$window, 'mouseup', this.onMouseUp, this);
        this.stopListening(this.$window, 'mousemove', this.trackMousePosition, this);

        if (this.isMouseClick()) {
            this.$scope.lockHighlightPoint = !this.$scope.lockHighlightPoint;
        }

        if (this.pan) {
            return this.endPan($event);
        }

        if (this.marquee) {
            return this.endMarquee($event);
        }
    };

    MCTPlotController.prototype.isMouseClick = function () {
        if (!this.marquee) {
            return false;
        }

        const { start, end } = this.marquee;

        return start.x === end.x && start.y === end.y;
    };

    MCTPlotController.prototype.updateMarquee = function () {
        if (!this.marquee) {
            return;
        }

        this.marquee.end = this.positionOverPlot;
        this.marquee.endPixels = this.positionOverElement;
    };

    MCTPlotController.prototype.startMarquee = function ($event) {
        this.$canvas.removeClass('plot-drag');
        this.$canvas.addClass('plot-marquee');

        this.trackMousePosition($event);
        if (this.positionOverPlot) {
            this.freeze();
            this.marquee = {
                startPixels: this.positionOverElement,
                endPixels: this.positionOverElement,
                start: this.positionOverPlot,
                end: this.positionOverPlot,
                color: [1, 1, 1, 0.5]
            };
            this.$scope.rectangles.push(this.marquee);
            this.trackHistory();
        }
    };

    MCTPlotController.prototype.endMarquee = function () {
        var startPixels = this.marquee.startPixels;
        var endPixels = this.marquee.endPixels;
        var marqueeDistance = Math.sqrt(
            Math.pow(startPixels.x - endPixels.x, 2)
            + Math.pow(startPixels.y - endPixels.y, 2)
        );
        // Don't zoom if mouse moved less than 7.5 pixels.
        if (marqueeDistance > 7.5) {
            this.$scope.xAxis.set('displayRange', {
                min: Math.min(this.marquee.start.x, this.marquee.end.x),
                max: Math.max(this.marquee.start.x, this.marquee.end.x)
            });
            this.$scope.yAxis.set('displayRange', {
                min: Math.min(this.marquee.start.y, this.marquee.end.y),
                max: Math.max(this.marquee.start.y, this.marquee.end.y)
            });
            this.$scope.$emit('user:viewport:change:end');
        } else {
            // A history entry is created by startMarquee, need to remove
            // if marquee zoom doesn't occur.
            this.plotHistory.pop();
        }

        this.$scope.rectangles = [];
        this.marquee = undefined;
    };

    MCTPlotController.prototype.zoom = function (zoomDirection, zoomFactor) {
        let zoomRatio = zoomFactor * 3;

        var currentXaxis = this.$scope.xAxis.get('displayRange'),
            currentYaxis = this.$scope.yAxis.get('displayRange');

        // when there is no plot data, the ranges can be undefined
        // in which case we should not perform zoom
        if (!currentXaxis || !currentYaxis) {
            return;
        }

        this.freeze();
        this.trackHistory();

        var xAxisDist = (currentXaxis.max - currentXaxis.min) * zoomFactor,
            yAxisDist = (currentYaxis.max - currentYaxis.min) * zoomFactor;

        if (zoomDirection === 'out') {
            xAxisDist = xAxisDist / zoomRatio;
            yAxisDist = yAxisDist / zoomRatio;
        }

        if (zoomDirection === 'in') {
            this.$scope.xAxis.set('displayRange', {
                min: currentXaxis.min + xAxisDist,
                max: currentXaxis.max - xAxisDist
            });

            this.$scope.yAxis.set('displayRange', {
                min: currentYaxis.min + yAxisDist,
                max: currentYaxis.max - yAxisDist
            });
        } else if (zoomDirection === 'out') {
            this.$scope.xAxis.set('displayRange', {
                min: currentXaxis.min - xAxisDist,
                max: currentXaxis.max + xAxisDist
            });

            this.$scope.yAxis.set('displayRange', {
                min: currentYaxis.min - yAxisDist,
                max: currentYaxis.max + yAxisDist
            });
        }

        this.$scope.$emit('user:viewport:change:end');
    };

    MCTPlotController.prototype.wheelZoom = function (event) {
        const ZOOM_AMT = 0.1;
        event.preventDefault();

        if (!this.positionOverPlot) {
            return;
        }

        let xDisplayRange = this.$scope.xAxis.get('displayRange'),
            yDisplayRange = this.$scope.yAxis.get('displayRange');

        // when there is no plot data, the ranges can be undefined
        // in which case we should not perform zoom
        if (!xDisplayRange || !yDisplayRange) {
            return;
        }

        this.freeze();
        window.clearTimeout(this.stillZooming);

        let xAxisDist = (xDisplayRange.max - xDisplayRange.min),
            yAxisDist = (yDisplayRange.max - yDisplayRange.min),
            xDistMouseToMax = xDisplayRange.max - this.positionOverPlot.x,
            xDistMouseToMin = this.positionOverPlot.x - xDisplayRange.min,
            yDistMouseToMax = yDisplayRange.max - this.positionOverPlot.y,
            yDistMouseToMin = this.positionOverPlot.y - yDisplayRange.min,
            xAxisMaxDist = xDistMouseToMax / xAxisDist,
            xAxisMinDist = xDistMouseToMin / xAxisDist,
            yAxisMaxDist = yDistMouseToMax / yAxisDist,
            yAxisMinDist = yDistMouseToMin / yAxisDist;

        let plotHistoryStep;

        if (!plotHistoryStep) {
            plotHistoryStep = {
                x: xDisplayRange,
                y: yDisplayRange
            };
        }

        if (event.wheelDelta < 0) {

            this.$scope.xAxis.set('displayRange', {
                min: xDisplayRange.min + ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                max: xDisplayRange.max - ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
            });

            this.$scope.yAxis.set('displayRange', {
                min: yDisplayRange.min + ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                max: yDisplayRange.max - ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
            });
        } else if (event.wheelDelta >= 0) {

            this.$scope.xAxis.set('displayRange', {
                min: xDisplayRange.min - ((xAxisDist * ZOOM_AMT) * xAxisMinDist),
                max: xDisplayRange.max + ((xAxisDist * ZOOM_AMT) * xAxisMaxDist)
            });

            this.$scope.yAxis.set('displayRange', {
                min: yDisplayRange.min - ((yAxisDist * ZOOM_AMT) * yAxisMinDist),
                max: yDisplayRange.max + ((yAxisDist * ZOOM_AMT) * yAxisMaxDist)
            });
        }

        this.stillZooming = window.setTimeout(function () {
            this.plotHistory.push(plotHistoryStep);
            plotHistoryStep = undefined;
            this.$scope.$emit('user:viewport:change:end');
        }.bind(this), 250);
    };

    MCTPlotController.prototype.startPan = function ($event) {
        this.$canvas.addClass('plot-drag');
        this.$canvas.removeClass('plot-marquee');

        this.trackMousePosition($event);
        this.freeze();
        this.pan = {
            start: this.positionOverPlot
        };
        $event.preventDefault();
        this.trackHistory();

        return false;
    };

    MCTPlotController.prototype.updatePan = function () {
        // calculate offset between points.  Apply that offset to viewport.
        if (!this.pan) {
            return;
        }

        var dX = this.pan.start.x - this.positionOverPlot.x,
            dY = this.pan.start.y - this.positionOverPlot.y,
            xRange = this.config.xAxis.get('displayRange'),
            yRange = this.config.yAxis.get('displayRange');

        this.config.xAxis.set('displayRange', {
            min: xRange.min + dX,
            max: xRange.max + dX
        });
        this.config.yAxis.set('displayRange', {
            min: yRange.min + dY,
            max: yRange.max + dY
        });
    };

    MCTPlotController.prototype.trackHistory = function () {
        this.plotHistory.push({
            x: this.config.xAxis.get('displayRange'),
            y: this.config.yAxis.get('displayRange')
        });
    };

    MCTPlotController.prototype.endPan = function () {
        this.pan = undefined;
        this.$scope.$emit('user:viewport:change:end');
    };

    MCTPlotController.prototype.freeze = function () {
        this.config.yAxis.set('frozen', true);
        this.config.xAxis.set('frozen', true);
    };

    MCTPlotController.prototype.clear = function () {
        this.config.yAxis.set('frozen', false);
        this.config.xAxis.set('frozen', false);
        this.$scope.plotHistory = this.plotHistory = [];
        this.$scope.$emit('user:viewport:change:end');
    };

    MCTPlotController.prototype.back = function () {
        var previousAxisRanges = this.plotHistory.pop();
        if (this.plotHistory.length === 0) {
            this.clear();

            return;
        }

        this.config.xAxis.set('displayRange', previousAxisRanges.x);
        this.config.yAxis.set('displayRange', previousAxisRanges.y);
        this.$scope.$emit('user:viewport:change:end');
    };

    MCTPlotController.prototype.destroy = function () {
        this.stopListening();
    };

    MCTPlotController.prototype.toggleCursorGuide = function ($event) {
        this.cursorGuide = !this.cursorGuide;
    };

    MCTPlotController.prototype.toggleYAxisLabel = function (label, options, series) {
        let yAxisObject = options.filter(o => o.name === label)[0];

        if (yAxisObject) {
            series.emit('change:yKey', yAxisObject.key);
            this.config.yAxis.set('label', label);
            this.$scope.yAxisLabel = label;
        }
    };

    return MCTPlotController;
});
