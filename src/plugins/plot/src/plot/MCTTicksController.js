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
    'lodash',
    '../lib/eventHelpers'
], function (
    _,
    eventHelpers
) {
    const e10 = Math.sqrt(50);
    const e5 = Math.sqrt(10);
    const e2 = Math.sqrt(2);

    /**
     * Nicely formatted tick steps from d3-array.
     */
    function tickStep(start, stop, count) {
        const step0 = Math.abs(stop - start) / Math.max(0, count);
        let step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10));
        const error = step0 / step1;
        if (error >= e10) {
            step1 *= 10;
        } else if (error >= e5) {
            step1 *= 5;
        } else if (error >= e2) {
            step1 *= 2;
        }

        return stop < start ? -step1 : step1;
    }

    /**
     * Find the precision (number of decimals) of a step.  Used to round
     * ticks to precise values.
     */
    function getPrecision(step) {
        const exponential = step.toExponential();
        const i = exponential.indexOf('e');
        if (i === -1) {
            return 0;
        }

        let precision = Math.max(0, -(Number(exponential.slice(i + 1))));

        if (precision > 20) {
            precision = 20;
        }

        return precision;
    }

    /**
     * Linear tick generation from d3-array.
     */
    function ticks(start, stop, count) {
        const step = tickStep(start, stop, count);
        const precision = getPrecision(step);

        return _.range(
            Math.ceil(start / step) * step,
            Math.floor(stop / step) * step + step / 2, // inclusive
            step
        ).map(function round(tick) {
            return Number(tick.toFixed(precision));
        });
    }

    function commonPrefix(a, b) {
        const maxLen = Math.min(a.length, b.length);
        let breakpoint = 0;
        for (let i = 0; i < maxLen; i++) {
            if (a[i] !== b[i]) {
                break;
            }

            if (a[i] === ' ') {
                breakpoint = i + 1;
            }
        }

        return a.slice(0, breakpoint);
    }

    function commonSuffix(a, b) {
        const maxLen = Math.min(a.length, b.length);
        let breakpoint = 0;
        for (let i = 0; i <= maxLen; i++) {
            if (a[a.length - i] !== b[b.length - i]) {
                break;
            }

            if ('. '.indexOf(a[a.length - i]) !== -1) {
                breakpoint = i;
            }
        }

        return a.slice(a.length - breakpoint);
    }

    function MCTTicksController($scope, $element) {
        this.$onInit = () => {
            this.$scope = $scope;
            this.$element = $element;

            this.tickCount = 4;
            this.tickUpdate = false;
            this.listenTo(this.axis, 'change:displayRange', this.updateTicks, this);
            this.listenTo(this.axis, 'change:format', this.updateTicks, this);
            this.listenTo(this.axis, 'change:key', this.updateTicksForceRegeneration, this);
            this.listenTo(this.$scope, '$destroy', this.stopListening, this);
            this.updateTicks();
        };
    }

    MCTTicksController.$inject = ['$scope', '$element'];

    eventHelpers.extend(MCTTicksController.prototype);

    /**
     * Determine whether ticks should be regenerated for a given range.
     * Ticks are updated
     * a) if they don't exist,
     * b) if existing ticks are outside of given range,
     * c) if range exceeds size of tick range by more than one tick step,
     * d) if forced to regenerate (ex. changing x-axis metadata).
     *
     * @private
     */
    MCTTicksController.prototype.shouldRegenerateTicks = function (range, forceRegeneration) {
        if (forceRegeneration) {
            return true;
        }

        if (!this.tickRange || !this.$scope.ticks || !this.$scope.ticks.length) {
            return true;
        }

        if (this.tickRange.max > range.max || this.tickRange.min < range.min) {
            return true;
        }

        if (Math.abs(range.max - this.tickRange.max) > this.tickRange.step) {
            return true;
        }

        if (Math.abs(this.tickRange.min - range.min) > this.tickRange.step) {
            return true;
        }

        return false;
    };

    MCTTicksController.prototype.getTicks = function () {
        const number = this.tickCount;
        const clampRange = this.axis.get('values');
        const range = this.axis.get('displayRange');
        if (clampRange) {
            return clampRange.filter(function (value) {
                return value <= range.max && value >= range.min;
            }, this);
        }

        return ticks(range.min, range.max, number);
    };

    MCTTicksController.prototype.updateTicksForceRegeneration = function () {
        this.updateTicks(true);
    };

    MCTTicksController.prototype.updateTicks = function (forceRegeneration = false) {
        const range = this.axis.get('displayRange');
        if (!range) {
            delete this.$scope.min;
            delete this.$scope.max;
            delete this.$scope.interval;
            delete this.tickRange;
            delete this.$scope.ticks;
            delete this.shouldCheckWidth;

            return;
        }

        const format = this.axis.get('format');
        if (!format) {
            return;
        }

        this.$scope.min = range.min;
        this.$scope.max = range.max;
        this.$scope.interval = Math.abs(range.min - range.max);
        if (this.shouldRegenerateTicks(range, forceRegeneration)) {
            let newTicks = this.getTicks();
            this.tickRange = {
                min: Math.min.apply(Math, newTicks),
                max: Math.max.apply(Math, newTicks),
                step: newTicks[1] - newTicks[0]
            };

            newTicks = newTicks
                .map(function (tickValue) {
                    return {
                        value: tickValue,
                        text: format(tickValue)
                    };
                }, this);

            if (newTicks.length && typeof newTicks[0].text === 'string') {
                const tickText = newTicks.map(function (t) {
                    return t.text;
                });
                const prefix = tickText.reduce(commonPrefix);
                const suffix = tickText.reduce(commonSuffix);
                newTicks.forEach(function (t, i) {
                    t.fullText = t.text;
                    if (suffix.length) {
                        t.text = t.text.slice(prefix.length, -suffix.length);
                    } else {
                        t.text = t.text.slice(prefix.length);
                    }
                });
            }

            this.$scope.ticks = newTicks;
            this.shouldCheckWidth = true;
        }

        this.scheduleTickUpdate();
    };

    MCTTicksController.prototype.scheduleTickUpdate = function () {
        if (this.tickUpdate) {
            return;
        }

        this.tickUpdate = true;
        setTimeout(this.doTickUpdate.bind(this), 0);
    };

    MCTTicksController.prototype.doTickUpdate = function () {
        if (this.shouldCheckWidth) {
            this.$scope.$digest();
            const element = this.$element[0];
            const tickElements = element.querySelectorAll('.gl-plot-tick > span');

            const tickWidth = Number([].reduce.call(tickElements, function (memo, first) {
                return Math.max(memo, first.offsetWidth);
            }, 0));

            this.$scope.tickWidth = tickWidth;
            this.$scope.$emit('plot:tickWidth', tickWidth);
            this.shouldCheckWidth = false;
        }

        this.$scope.$digest();
        this.tickUpdate = false;
    };

    return MCTTicksController;
});
