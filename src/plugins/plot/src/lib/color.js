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

define(function () {

    const COLOR_PALETTE = [
        [0x20, 0xB2, 0xAA],
        [0x9A, 0xCD, 0x32],
        [0xFF, 0x8C, 0x00],
        [0xD2, 0xB4, 0x8C],
        [0x40, 0xE0, 0xD0],
        [0x41, 0x69, 0xFF],
        [0xFF, 0xD7, 0x00],
        [0x6A, 0x5A, 0xCD],
        [0xEE, 0x82, 0xEE],
        [0xCC, 0x99, 0x66],
        [0x99, 0xCC, 0xCC],
        [0x66, 0xCC, 0x33],
        [0xFF, 0xCC, 0x00],
        [0xFF, 0x66, 0x33],
        [0xCC, 0x66, 0xFF],
        [0xFF, 0x00, 0x66],
        [0xFF, 0xFF, 0x00],
        [0x80, 0x00, 0x80],
        [0x00, 0x86, 0x8B],
        [0x00, 0x8A, 0x00],
        [0xFF, 0x00, 0x00],
        [0x00, 0x00, 0xFF],
        [0xF5, 0xDE, 0xB3],
        [0xBC, 0x8F, 0x8F],
        [0x46, 0x82, 0xB4],
        [0xFF, 0xAF, 0xAF],
        [0x43, 0xCD, 0x80],
        [0xCD, 0xC1, 0xC5],
        [0xA0, 0x52, 0x2D],
        [0x64, 0x95, 0xED]
    ];

    function isDefaultColor(color) {
        const a = color.asIntegerArray();

        return COLOR_PALETTE.some(function (b) {
            return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
        });
    }

    /**
     * A representation of a color that allows conversions between different
     * formats.
     *
     * @constructor
     */
    function Color(integerArray) {
        this.integerArray = integerArray;
    }

    Color.fromHexString = function (hexString) {
        if (!/#([0-9a-fA-F]{2}){2}/.test(hexString)) {
            throw new Error(
                'Invalid input "'
                + hexString
                + '". Hex string must be in CSS format e.g. #00FF00'
            );
        }

        return new Color([
            parseInt(hexString.slice(1, 3), 16),
            parseInt(hexString.slice(3, 5), 16),
            parseInt(hexString.slice(5, 7), 16)
        ]);
    };

    /**
     * Return color as a three element array of RGB values, where each value
     * is a integer in the range of 0-255.
     *
     * @return {number[]} the color, as integer RGB values
     */
    Color.prototype.asIntegerArray = function () {
        return this.integerArray.map(function (c) {
            return c;
        });
    };

    /**
     * Return color as a string using #-prefixed six-digit RGB hex notation
     * (e.g. #FF0000).  See http://www.w3.org/TR/css3-color/#rgb-color.
     *
     * @return {string} the color, as a style-friendly string
     */

    Color.prototype.asHexString = function () {
        return '#' + this.integerArray.map(function (c) {
            return (c < 16 ? '0' : '') + c.toString(16);
        }).join('');
    };

    /**
     * Return color as a RGBA float array.
     *
     * This format is present specifically to support use with
     * WebGL, which expects colors of that form.
     *
     * @return {number[]} the color, as floating-point RGBA values
     */
    Color.prototype.asRGBAArray = function () {
        return this.integerArray.map(function (c) {
            return c / 255.0;
        }).concat([1]);
    };

    Color.prototype.equalTo = function (otherColor) {
        return this.asHexString() === otherColor.asHexString();
    };

    /**
     * A color palette stores a set of colors and allows for different
     * methods of color allocation.
     *
     * @constructor
     */
    function ColorPalette() {
        const allColors = this.allColors = COLOR_PALETTE.map(function (color) {
            return new Color(color);
        });
        this.colorGroups = [[], [], []];
        for (let i = 0; i < allColors.length; i++) {
            this.colorGroups[i % 3].push(allColors[i]);
        }

        this.reset();
    }

    /**
     *
     */
    ColorPalette.prototype.groups = function () {
        return this.colorGroups;
    };

    ColorPalette.prototype.reset = function () {
        this.availableColors = this.allColors.slice();
    };

    ColorPalette.prototype.remove = function (color) {
        this.availableColors = this.availableColors.filter(function (c) {
            return !c.equalTo(color);
        });
    };

    ColorPalette.prototype.return = function (color) {
        if (isDefaultColor(color)) {
            this.availableColors.unshift(color);
        }
    };

    ColorPalette.prototype.getByHexString = function (hexString) {
        const color = Color.fromHexString(hexString);

        return color;
    };

    /**
     * @returns {Color} the next unused color in the palette.  If all colors
     * have been allocated, it will wrap around.
     */
    ColorPalette.prototype.getNextColor = function () {
        if (!this.availableColors.length) {
            console.warn('Color Palette empty, reusing colors!');
            this.reset();
        }

        return this.availableColors.shift();
    };

    /**
     * @param {number} index the index of the color to return.  An index
     * value larger than the size of the index will wrap around.
     * @returns {Color}
    */
    ColorPalette.prototype.getColor = function (index) {
        return this.colors[index % this.colors.length];
    };

    return {
        Color: Color,
        ColorPalette: ColorPalette
    };
});
