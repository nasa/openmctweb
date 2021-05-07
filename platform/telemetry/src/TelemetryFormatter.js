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
    [],
    function () {

        /**
         * The TelemetryFormatter is responsible for formatting (as text
         * for display) values along either the domain (usually time) or
         * the range (usually value) of a data series.
         * @memberof platform/telemetry
         * @constructor
         * @param {FormatService} formatService the service to user to format
         *        domain values
         * @param {string} defaultFormatKey the format to request when no
         *        format has been otherwise specified
         */
        function TelemetryFormatter(formatService, defaultFormatKey) {
            this.formatService = formatService;
            this.defaultFormat = formatService.getFormat(defaultFormatKey);
        }

        /**
         * Format a domain value.
         * @param {number} v the domain value; usually, a timestamp
         *        in milliseconds since start of 1970
         * @param {string} [key] a key which identifies the format
         *        to use
         * @returns {string} a textual representation of the
         *        data and time, suitable for display.
         */
        TelemetryFormatter.prototype.formatDomainValue = function (v, key) {
            var formatter = (key === undefined)
                ? this.defaultFormat
                : this.formatService.getFormat(key);

            return isNaN(v) ? "" : formatter.format(v);
        };

        /**
         * Format a range value.
         * @param {number} v the range value; a numeric value
         * @param {string} [key] the key which identifies the
         *        range; if unspecified or unknown, this will
         *        be treated as a numeric value.
         * @returns {string} a textual representation of the
         *        value, suitable for display.
         */
        TelemetryFormatter.prototype.formatRangeValue = function (v, key) {
            return String(v);
        };

        return TelemetryFormatter;
    }
);
