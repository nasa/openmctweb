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

define([

], function () {

    var TICK_SPACING_PX = 150;

    /* format number as percent; 0.0-1.0 to "0%"-"100%" */
    function toPercent(p) {
        return (100 * p) + "%";
    }

    function clamp(value, low, high) {
        return Math.max(low, Math.min(high, value));
    }

    function copyBounds(bounds) {
        return {
            start: bounds.start,
            end: bounds.end
        };
    }

    /**
     * Controller used by the `time-controller` template.
     * @memberof platform/commonUI/general
     * @constructor
     * @param $scope the Angular scope for this controller
     * @param {FormatService} formatService the service to user to format
     *        domain values
     * @param {string} defaultFormat the format to request when no
     *        format has been otherwise specified
     * @param {Function} now a function to return current system time
     */
    function TimeRangeController($scope, $timeout, formatService, defaultFormat, now) {
        this.$scope = $scope;
        this.formatService = formatService;
        this.defaultFormat = defaultFormat;
        this.now = now;

        this.tickCount = 2;
        this.innerMinimumSpan = 1000; // 1 second
        this.outerMinimumSpan = 1000; // 1 second
        this.initialDragValue = undefined;
        this.formatter = formatService.getFormat(defaultFormat);
        this.formStartChanged = false;
        this.formEndChanged = false;
        this.$timeout = $timeout;

        this.$scope.ticks = [];

        this.updateViewFromModel(this.$scope.ngModel);
        this.updateFormModel();

        [
            'updateViewFromModel',
            'updateSpanWidth',
            'updateOuterStart',
            'updateOuterEnd',
            'updateFormat',
            'validateStart',
            'validateEnd',
            'onFormStartChange',
            'onFormEndChange'
        ].forEach(function (boundFn) {
            this[boundFn] = this[boundFn].bind(this);
        }, this);

        this.$scope.$watchCollection("ngModel", this.updateViewFromModel);
        this.$scope.$watch("spanWidth", this.updateSpanWidth);
        this.$scope.$watch("ngModel.outer.start", this.updateOuterStart);
        this.$scope.$watch("ngModel.outer.end", this.updateOuterEnd);
        this.$scope.$watch("parameters.format", this.updateFormat);
        this.$scope.$watch("formModel.start", this.onFormStartChange);
        this.$scope.$watch("formModel.end", this.onFormEndChange);
    }

    TimeRangeController.prototype.formatTimestamp = function (ts) {
        return this.formatter.format(ts);
    };

    TimeRangeController.prototype.updateTicks = function () {
        var i, p, ts, start, end, span;
        end = this.$scope.ngModel.outer.end;
        start = this.$scope.ngModel.outer.start;
        span = end - start;
        this.$scope.ticks = [];
        for (i = 0; i < this.tickCount; i += 1) {
            p = i / (this.tickCount - 1);
            ts = p * span + start;
            this.$scope.ticks.push(this.formatTimestamp(ts));
        }
    };

    TimeRangeController.prototype.updateSpanWidth = function (w) {
        this.tickCount = Math.max(Math.floor(w / TICK_SPACING_PX), 2);
        this.updateTicks();
    };

    TimeRangeController.prototype.updateViewForInnerSpanFromModel = function (
        ngModel
    ) {
        var span = ngModel.outer.end - ngModel.outer.start;

        // Expose readable dates for the knobs
        this.$scope.startInnerText = this.formatTimestamp(ngModel.inner.start);
        this.$scope.endInnerText = this.formatTimestamp(ngModel.inner.end);

        // And positions for the knobs
        this.$scope.startInnerPct =
            toPercent((ngModel.inner.start - ngModel.outer.start) / span);
        this.$scope.endInnerPct =
            toPercent((ngModel.outer.end - ngModel.inner.end) / span);
    };

    TimeRangeController.prototype.defaultBounds = function () {
        var t = this.now();

        return {
            start: t - 24 * 3600 * 1000, // One day
            end: t
        };
    };

    TimeRangeController.prototype.updateViewFromModel = function (ngModel) {
        ngModel = ngModel || {};
        ngModel.outer = ngModel.outer || this.defaultBounds();
        ngModel.inner = ngModel.inner || copyBounds(ngModel.outer);

        // Stick it back is scope (in case we just set defaults)
        this.$scope.ngModel = ngModel;

        this.updateViewForInnerSpanFromModel(ngModel);
        this.updateTicks();
    };

    TimeRangeController.prototype.startLeftDrag = function () {
        this.initialDragValue = this.$scope.ngModel.inner.start;
    };

    TimeRangeController.prototype.startRightDrag = function () {
        this.initialDragValue = this.$scope.ngModel.inner.end;
    };

    TimeRangeController.prototype.startMiddleDrag = function () {
        this.initialDragValue = {
            start: this.$scope.ngModel.inner.start,
            end: this.$scope.ngModel.inner.end
        };
    };

    TimeRangeController.prototype.toMillis = function (pixels) {
        var span =
            this.$scope.ngModel.outer.end - this.$scope.ngModel.outer.start;

        return (pixels / this.$scope.spanWidth) * span;
    };

    TimeRangeController.prototype.leftDrag = function (pixels) {
        var delta = this.toMillis(pixels);
        this.$scope.ngModel.inner.start = clamp(
            this.initialDragValue + delta,
            this.$scope.ngModel.outer.start,
            this.$scope.ngModel.inner.end - this.innerMinimumSpan
        );
        this.updateViewFromModel(this.$scope.ngModel);
    };

    TimeRangeController.prototype.rightDrag = function (pixels) {
        var delta = this.toMillis(pixels);
        this.$scope.ngModel.inner.end = clamp(
            this.initialDragValue + delta,
            this.$scope.ngModel.inner.start + this.innerMinimumSpan,
            this.$scope.ngModel.outer.end
        );
        this.updateViewFromModel(this.$scope.ngModel);
    };

    TimeRangeController.prototype.middleDrag = function (pixels) {
        var delta = this.toMillis(pixels),
            edge = delta < 0 ? 'start' : 'end',
            opposite = delta < 0 ? 'end' : 'start';

        // Adjust the position of the edge in the direction of drag
        this.$scope.ngModel.inner[edge] = clamp(
            this.initialDragValue[edge] + delta,
            this.$scope.ngModel.outer.start,
            this.$scope.ngModel.outer.end
        );
        // Adjust opposite knob to maintain span
        this.$scope.ngModel.inner[opposite] =
            this.$scope.ngModel.inner[edge]
            + this.initialDragValue[opposite]
            - this.initialDragValue[edge];

        this.updateViewFromModel(this.$scope.ngModel);
    };

    TimeRangeController.prototype.updateFormModel = function () {
        this.$scope.formModel = {
            start: ((this.$scope.ngModel || {}).outer || {}).start,
            end: ((this.$scope.ngModel || {}).outer || {}).end
        };
    };

    TimeRangeController.prototype.updateOuterStart = function () {
        var ngModel = this.$scope.ngModel;

        ngModel.inner.start =
            Math.max(ngModel.outer.start, ngModel.inner.start);
        ngModel.inner.end = Math.max(
            ngModel.inner.start + this.innerMinimumSpan,
            ngModel.inner.end
        );

        this.updateFormModel();
        this.updateViewForInnerSpanFromModel(ngModel);
        this.updateTicks();
    };

    TimeRangeController.prototype.updateOuterEnd = function () {
        var ngModel = this.$scope.ngModel;

        ngModel.inner.end =
            Math.min(ngModel.outer.end, ngModel.inner.end);
        ngModel.inner.start = Math.min(
            ngModel.inner.end - this.innerMinimumSpan,
            ngModel.inner.start
        );

        this.updateFormModel();
        this.updateViewForInnerSpanFromModel(ngModel);
        this.updateTicks();
    };

    TimeRangeController.prototype.updateFormat = function (key) {
        this.formatter = this.formatService.getFormat(key || this.defaultFormat);
        this.updateViewForInnerSpanFromModel(this.$scope.ngModel);
        this.updateTicks();
    };

    TimeRangeController.prototype.updateBoundsFromForm = function () {
        var self = this;

        //Allow Angular to trigger watches and determine whether values have changed.
        this.$timeout(function () {
            if (self.formStartChanged) {
                self.$scope.ngModel.outer.start =
                    self.$scope.ngModel.inner.start =
                        self.$scope.formModel.start;
                self.formStartChanged = false;
            }

            if (self.formEndChanged) {
                self.$scope.ngModel.outer.end =
                    self.$scope.ngModel.inner.end =
                        self.$scope.formModel.end;
                self.formEndChanged = false;
            }
        });
    };

    TimeRangeController.prototype.onFormStartChange = function (
        newValue,
        oldValue
    ) {
        if (!this.formStartChanged && newValue !== oldValue) {
            this.formStartChanged = true;
        }
    };

    TimeRangeController.prototype.onFormEndChange = function (
        newValue,
        oldValue
    ) {
        if (!this.formEndChanged && newValue !== oldValue) {
            this.formEndChanged = true;
        }
    };

    TimeRangeController.prototype.validateStart = function (startValue) {
        return startValue
            <= this.$scope.formModel.end - this.outerMinimumSpan;
    };

    TimeRangeController.prototype.validateEnd = function (endValue) {
        return endValue
            >= this.$scope.formModel.start + this.outerMinimumSpan;
    };

    return TimeRangeController;
});
