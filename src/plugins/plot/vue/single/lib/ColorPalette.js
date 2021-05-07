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

/**
     * A color palette stores a set of colors and allows for different
     * methods of color allocation.
     *
     * @constructor
     */
import { isDefaultColor, COLOR_PALETTE } from './ColorHelper';
import Color from './Color';

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

export default ColorPalette;
