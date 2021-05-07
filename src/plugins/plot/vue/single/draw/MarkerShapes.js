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
     * @label string (required) display name of shape
     * @drawWebGL integer (unique, required) index provided to WebGL Fragment Shader
     * @drawC2D function (required) canvas2d draw function
     */
export const MARKER_SHAPES = {
    point: {
        label: 'Point',
        drawWebGL: 1,
        drawC2D: function (x, y, size) {
            const offset = size / 2;

            this.c2d.fillRect(x - offset, y - offset, size, size);
        }
    },
    circle: {
        label: 'Circle',
        drawWebGL: 2,
        drawC2D: function (x, y, size) {
            const radius = size / 2;

            this.c2d.beginPath();
            this.c2d.arc(x, y, radius, 0, 2 * Math.PI, false);
            this.c2d.closePath();
            this.c2d.fill();
        }
    },
    diamond: {
        label: 'Diamond',
        drawWebGL: 3,
        drawC2D: function (x, y, size) {
            const offset = size / 2;
            const top = [x, y + offset];
            const right = [x + offset, y];
            const bottom = [x, y - offset];
            const left = [x - offset, y];

            this.c2d.beginPath();
            this.c2d.moveTo(...top);
            this.c2d.lineTo(...right);
            this.c2d.lineTo(...bottom);
            this.c2d.lineTo(...left);
            this.c2d.closePath();
            this.c2d.fill();
        }
    },
    triangle: {
        label: 'Triangle',
        drawWebGL: 4,
        drawC2D: function (x, y, size) {
            const offset = size / 2;
            const v1 = [x, y - offset];
            const v2 = [x - offset, y + offset];
            const v3 = [x + offset, y + offset];

            this.c2d.beginPath();
            this.c2d.moveTo(...v1);
            this.c2d.lineTo(...v2);
            this.c2d.lineTo(...v3);
            this.c2d.closePath();
            this.c2d.fill();
        }
    }
};
