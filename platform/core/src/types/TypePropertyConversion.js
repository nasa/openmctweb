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

        var conversions = {
                number: {
                    toModelValue: parseFloat,
                    toFormValue: function (modelValue) {
                        return (typeof modelValue === 'number')
                            ? modelValue.toString(10) : undefined;
                    }
                },
                identity: {
                    toModelValue: function (v) {
                        return v;
                    },
                    toFormValue: function (v) {
                        return v;
                    }
                }
            },
            ARRAY_SUFFIX = '[]';

        // Utility function to handle arrays of conversions
        function ArrayConversion(conversion) {
            return {
                toModelValue: function (formValue) {
                    return formValue && formValue.map(conversion.toModelValue);
                },
                toFormValue: function (modelValue) {
                    return modelValue && modelValue.map(conversion.toFormValue);
                }
            };
        }

        /**
         * Look up an appropriate conversion between form values and model
         * values, e.g. to numeric values.
         * @constructor
         * @memberof platform/core
         */
        function TypePropertyConversion(name) {
            if (name
                    && name.length > ARRAY_SUFFIX.length
                    && name.indexOf(ARRAY_SUFFIX, name.length - ARRAY_SUFFIX.length) !== -1) {
                return new ArrayConversion(
                    new TypePropertyConversion(
                        name.substring(0, name.length - ARRAY_SUFFIX.length)
                    )
                );
            } else {
                if (!conversions[name]) {
                    throw new Error("Unknown conversion type: " + name);
                }

                return conversions[name];
            }
        }

        /**
         * Convert a value from its format as read from a form, to a
         * format appropriate to store in a model.
         * @method platform/core.TypePropertyConversion#toModelValue
         * @param {*} formValue value as read from a form
         * @returns {*} value to store in a model
         */

        /**
         * Convert a value from its format as stored in a model, to a
         * format appropriate to display in a form.
         * @method platform/core.TypePropertyConversion#toFormValue
         * @param {*} modelValue value as stored in a model
         * @returns {*} value to display within a form
         */

        return TypePropertyConversion;
    }
);
