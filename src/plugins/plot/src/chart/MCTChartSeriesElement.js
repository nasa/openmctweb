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
    '../lib/extend',
    '../lib/eventHelpers'
], function (
    extend,
    eventHelpers
) {

    function MCTChartSeriesElement(series, chart, offset) {
        this.series = series;
        this.chart = chart;
        this.offset = offset;
        this.buffer = new Float32Array(20000);
        this.count = 0;
        this.listenTo(series, 'add', this.append, this);
        this.listenTo(series, 'remove', this.remove, this);
        this.listenTo(series, 'reset', this.reset, this);
        this.listenTo(series, 'destroy', this.destroy, this);
        series.data.forEach(function (point, index) {
            this.append(point, index, series);
        }, this);
    }

    MCTChartSeriesElement.extend = extend;

    eventHelpers.extend(MCTChartSeriesElement.prototype);

    MCTChartSeriesElement.prototype.getBuffer = function () {
        if (this.isTempBuffer) {
            this.buffer = new Float32Array(this.buffer);
            this.isTempBuffer = false;
        }

        return this.buffer;
    };

    MCTChartSeriesElement.prototype.color = function () {
        return this.series.get('color');
    };

    MCTChartSeriesElement.prototype.vertexCountForPointAtIndex = function (index) {
        return 2;
    };

    MCTChartSeriesElement.prototype.startIndexForPointAtIndex = function (index) {
        return 2 * index;
    };

    MCTChartSeriesElement.prototype.removeSegments = function (index, count) {
        const target = index;
        const start = index + count;
        const end = this.count * 2;
        this.buffer.copyWithin(target, start, end);
        for (let zero = end - count; zero < end; zero++) {
            this.buffer[zero] = 0;
        }
    };

    MCTChartSeriesElement.prototype.removePoint = function (point, index, count) {
        // by default, do nothing.
    };

    MCTChartSeriesElement.prototype.remove = function (point, index, series) {
        const vertexCount = this.vertexCountForPointAtIndex(index);
        const removalPoint = this.startIndexForPointAtIndex(index);

        this.removeSegments(removalPoint, vertexCount);

        this.removePoint(
            this.makePoint(point, series),
            removalPoint,
            vertexCount
        );
        this.count -= (vertexCount / 2);
    };

    MCTChartSeriesElement.prototype.makePoint = function (point, series) {
        if (!this.offset.xVal) {
            this.chart.setOffset(point, undefined, series);
        }

        return {
            x: this.offset.xVal(point, series),
            y: this.offset.yVal(point, series)
        };
    };

    MCTChartSeriesElement.prototype.append = function (point, index, series) {
        const pointsRequired = this.vertexCountForPointAtIndex(index);
        const insertionPoint = this.startIndexForPointAtIndex(index);
        this.growIfNeeded(pointsRequired);
        this.makeInsertionPoint(insertionPoint, pointsRequired);
        this.addPoint(
            this.makePoint(point, series),
            insertionPoint,
            pointsRequired
        );
        this.count += (pointsRequired / 2);
    };

    MCTChartSeriesElement.prototype.makeInsertionPoint = function (insertionPoint, pointsRequired) {
        if (this.count * 2 > insertionPoint) {
            if (!this.isTempBuffer) {
                this.buffer = Array.prototype.slice.apply(this.buffer);
                this.isTempBuffer = true;
            }

            const target = insertionPoint + pointsRequired;
            let start = insertionPoint;
            for (; start < target; start++) {
                this.buffer.splice(start, 0, 0);
            }
        }
    };

    MCTChartSeriesElement.prototype.reset = function () {
        this.buffer = new Float32Array(20000);
        this.count = 0;
        if (this.offset.x) {
            this.series.data.forEach(function (point, index) {
                this.append(point, index, this.series);
            }, this);
        }
    };

    MCTChartSeriesElement.prototype.growIfNeeded = function (pointsRequired) {
        const remainingPoints = this.buffer.length - this.count * 2;
        let temp;

        if (remainingPoints <= pointsRequired) {
            temp = new Float32Array(this.buffer.length + 20000);
            temp.set(this.buffer);
            this.buffer = temp;
        }
    };

    MCTChartSeriesElement.prototype.destroy = function () {
        this.stopListening();
    };

    return MCTChartSeriesElement;
});
