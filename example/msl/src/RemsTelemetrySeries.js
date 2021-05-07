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
define(
    function () {
        "use strict";

        /**
         * @typedef {Object} RemsTelemetryValue
         * @memberOf example/msl
         * @property {number} date The date/time of the telemetry value. Constitutes the domain value of this value pair
         * @property {number} value The value of this telemetry datum.
         * A floating point value representing some observable quantity (eg.
         * temperature, air pressure, etc.)
         */

        /**
         * A representation of a collection of telemetry data. The REMS
         * telemetry data is time ordered, with the 'domain' value
         * constituting the time stamp of each data value and the
         * 'range' being the value itself.
         *
         * TelemetrySeries will typically wrap an array of telemetry data,
         * and provide an interface for retrieving individual an telemetry
         * value.
         * @memberOf example/msl
         * @param {Array<RemsTelemetryValue>} data An array of telemetry values
         * @constructor
         */
        function RemsTelemetrySeries(data) {
            this.data = data;
        }

        /**
         * @returns {number} A count of the number of data values available in
         * this series
         */
        RemsTelemetrySeries.prototype.getPointCount = function () {
            return this.data.length;
        };

        /**
         * The domain value at the given index. The Rems telemetry data is
         * time ordered, so the domain value is the time stamp of each data
         * value.
         * @param index
         * @returns {number} the time value in ms since 1 January 1970
         */
        RemsTelemetrySeries.prototype.getDomainValue = function (index) {
            return this.data[index].date;
        };

        /**
         * The range value of the REMS data set is the value of the thing
         * being measured, be it temperature, air pressure, etc.
         * @param index The datum in the data series to return the range
         * value of.
         * @returns {number} A floating point number
         */
        RemsTelemetrySeries.prototype.getRangeValue = function (index) {
            return this.data[index].value;
        };

        return RemsTelemetrySeries;
    }
);
