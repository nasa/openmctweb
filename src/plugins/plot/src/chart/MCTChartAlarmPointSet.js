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

    function MCTChartAlarmPointSet(series, chart, offset) {
        this.series = series;
        this.chart = chart;
        this.offset = offset;
        this.points = [];

        this.listenTo(series, 'add', this.append, this);
        this.listenTo(series, 'remove', this.remove, this);
        this.listenTo(series, 'reset', this.reset, this);
        this.listenTo(series, 'destroy', this.destroy, this);
        series.data.forEach(function (point, index) {
            this.append(point, index, series);
        }, this);
    }

    MCTChartAlarmPointSet.prototype.append = function (datum) {
        if (datum.mctLimitState) {
            this.points.push({
                x: this.offset.xVal(datum, this.series),
                y: this.offset.yVal(datum, this.series),
                datum: datum
            });
        }
    };

    MCTChartAlarmPointSet.prototype.remove = function (datum) {
        this.points = this.points.filter(function (p) {
            return p.datum !== datum;
        });
    };

    MCTChartAlarmPointSet.prototype.reset = function () {
        this.points = [];
    };

    MCTChartAlarmPointSet.prototype.destroy = function () {
        this.stopListening();
    };

    eventHelpers.extend(MCTChartAlarmPointSet.prototype);

    return MCTChartAlarmPointSet;

});
