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
    'printj'
], function (
    _,
    printj
) {

    // TODO: needs reference to formatService;
    function TelemetryValueFormatter(valueMetadata, formatService) {
        const numberFormatter = {
            parse: function (x) {
                return Number(x);
            },
            format: function (x) {
                return x;
            },
            validate: function (x) {
                return true;
            }
        };

        this.valueMetadata = valueMetadata;
        try {
            this.formatter = formatService
                .getFormat(valueMetadata.format, valueMetadata);
        } catch (e) {
            // TODO: Better formatting
            this.formatter = numberFormatter;
        }

        if (valueMetadata.format === 'enum') {
            this.formatter = {};
            this.enumerations = valueMetadata.enumerations.reduce(function (vm, e) {
                vm.byValue[e.value] = e.string;
                vm.byString[e.string] = e.value;

                return vm;
            }, {
                byValue: {},
                byString: {}
            });
            this.formatter.format = function (value) {
                if (Object.prototype.hasOwnProperty.call(this.enumerations.byValue, value)) {
                    return this.enumerations.byValue[value];
                }

                return value;
            }.bind(this);
            this.formatter.parse = function (string) {
                if (typeof string === "string") {
                    if (Object.prototype.hasOwnProperty.call(this.enumerations.byString, string)) {
                        return this.enumerations.byString[string];
                    }
                }

                return Number(string);
            }.bind(this);
        }

        // Check for formatString support once instead of per format call.
        if (valueMetadata.formatString) {
            const baseFormat = this.formatter.format;
            const formatString = valueMetadata.formatString;
            this.formatter.format = function (value) {
                return printj.sprintf(formatString, baseFormat.call(this, value));
            };
        }

        if (valueMetadata.format === 'string') {
            this.formatter.parse = function (value) {
                if (value === undefined) {
                    return '';
                }

                if (typeof value === 'string') {
                    return value;
                } else {
                    return value.toString();
                }
            };

            this.formatter.format = function (value) {
                return value;
            };

            this.formatter.validate = function (value) {
                return typeof value === 'string';
            };
        }
    }

    TelemetryValueFormatter.prototype.parse = function (datum) {
        if (_.isObject(datum)) {
            return this.formatter.parse(datum[this.valueMetadata.source]);
        }

        return this.formatter.parse(datum);
    };

    TelemetryValueFormatter.prototype.format = function (datum) {
        if (_.isObject(datum)) {
            return this.formatter.format(datum[this.valueMetadata.source]);
        }

        return this.formatter.format(datum);
    };

    return TelemetryValueFormatter;
});
