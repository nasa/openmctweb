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
         * Handles drag interactions on frames in layouts. This will
         * provides new positions/dimensions for frames based on
         * relative pixel positions provided; these will take into account
         * the grid size (in a snap-to sense) and will enforce some minimums
         * on both position and dimensions.
         *
         * The provided position and dimensions factors will determine
         * whether this is a move or a resize, and what type of resize it
         * will be. For instance, a position factor of [1, 1]
         * will move a frame along with the mouse as the drag
         * proceeds, while a dimension factor of [0, 0] will leave
         * dimensions unchanged. Combining these in different
         * ways results in different handles; a position factor of
         * [1, 0] and a dimensions factor of [-1, 0] will implement
         * a left-edge resize, as the horizontal position will move
         * with the mouse while the horizontal dimensions shrink in
         * kind (and vertical properties remain unmodified.)
         *
         * @param {object} rawPosition the initial position/dimensions
         *                 of the frame being interacted with
         * @param {number[]} posFactor the position factor
         * @param {number[]} dimFactor the dimensions factor
         * @param {number[]} the size of each grid element, in pixels
         * @constructor
         * @memberof platform/features/layout
         */
        function LayoutDrag(rawPosition, posFactor, dimFactor, gridSize) {
            this.rawPosition = rawPosition;
            this.posFactor = posFactor;
            this.dimFactor = dimFactor;
            this.gridSize = gridSize;
        }

        // Convert a delta from pixel coordinates to grid coordinates,
        // rounding to whole-number grid coordinates.
        function toGridDelta(gridSize, pixelDelta) {
            return pixelDelta.map(function (v, i) {
                return Math.round(v / gridSize[i]);
            });
        }

        // Utility function to perform element-by-element multiplication
        function multiply(array, factors) {
            return array.map(function (v, i) {
                return v * factors[i];
            });
        }

        // Utility function to perform element-by-element addition
        function add(array, other) {
            return array.map(function (v, i) {
                return v + other[i];
            });
        }

        // Utility function to perform element-by-element max-choosing
        function max(array, other) {
            return array.map(function (v, i) {
                return Math.max(v, other[i]);
            });
        }

        /**
         * Get a new position object in grid coordinates, with
         * position and dimensions both offset appropriately
         * according to the factors supplied in the constructor.
         * @param {number[]} pixelDelta the offset from the
         *        original position, in pixels
         */
        LayoutDrag.prototype.getAdjustedPositionAndDimensions = function (pixelDelta) {
            const gridDelta = toGridDelta(this.gridSize, pixelDelta);

            return {
                position: max(add(
                    this.rawPosition.position,
                    multiply(gridDelta, this.posFactor)
                ), [0, 0]),
                dimensions: max(add(
                    this.rawPosition.dimensions,
                    multiply(gridDelta, this.dimFactor)
                ), [1, 1])
            };
        };

        LayoutDrag.prototype.getAdjustedPosition = function (pixelDelta) {
            const gridDelta = toGridDelta(this.gridSize, pixelDelta);

            return {
                position: max(add(
                    this.rawPosition.position,
                    multiply(gridDelta, this.posFactor)
                ), [0, 0])
            };
        };

        return LayoutDrag;

    }
);
