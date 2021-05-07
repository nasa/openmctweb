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

], function (

) {

    /**
     * An object used to convert between numeric values and text values,
     * typically used to display these values to the user and to convert
     * user input to a numeric format, particularly for time formats.
     * @interface Format
     */
    /**
     * Parse text (typically user input) to a numeric value.
     * Behavior is undefined when the text cannot be parsed;
     * `validate` should be called first if the text may be invalid.
     * @method Format#parse
     * @memberof Format#
     * @param {string} text the text to parse
     * @returns {number} the parsed numeric value
     */

    /**
     * @property {string} key A unique identifier for this formatter.
     * @memberof Format#
     */

    /**
     * Determine whether or not some text (typically user input) can
     * be parsed to a numeric value by this format.
     * @method validate
     * @memberof Format#
     * @param {string} text the text to parse
     * @returns {boolean} true if the text can be parsed
     */

    /**
     * Convert a numeric value to a text value for display using
     * this format.
     * @method format
     * @memberof Format#
     * @param {number} value the numeric value to format
     * @param {number} [minValue] Contextual information for scaled formatting used in linear scales such as conductor
     * and plot axes. Specifies the smallest number on the scale.
     * @param {number} [maxValue] Contextual information for scaled formatting used in linear scales such as conductor
     * and plot axes. Specifies the largest number on the scale
     * @param {number} [count] Contextual information for scaled formatting used in linear scales such as conductor
     * and plot axes. The number of labels on the scale.
     * @returns {string} the text representation of the value
     */

    /**
     * Provides access to `Format` objects which can be used to
     * convert values between human-readable text and numeric
     * representations.
     * @interface FormatService
     */

    /**
     * Look up a format by its symbolic identifier.
     * @method getFormat
     * @memberof FormatService#
     * @param {string} key the identifier for this format
     * @returns {Format} the format
     * @throws {Error} errors when the requested format is unrecognized
     */

    /**
     * Provides formats from the `formats` extension category.
     * @constructor
     * @implements {FormatService}
     * @memberof platform/commonUI/formats
     * @param {Array.<function(new : Format)>} format constructors,
     *        from the `formats` extension category.
     */
    function FormatProvider(formats) {
        var formatMap = {};

        function addToMap(Format) {
            var key = Format.key;
            if (key && !formatMap[key]) {
                formatMap[key] = new Format();
            }
        }

        formats.forEach(addToMap);
        this.formatMap = formatMap;
    }

    FormatProvider.prototype.getFormat = function (key) {
        var format = this.formatMap[key];
        if (!format) {
            throw new Error("FormatProvider: No format found for " + key);
        }

        return format;
    };

    return FormatProvider;

});
