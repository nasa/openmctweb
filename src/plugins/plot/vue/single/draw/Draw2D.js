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

import EventEmitter from 'EventEmitter';
import eventHelpers from '../lib/eventHelpers';
import { MARKER_SHAPES } from './MarkerShapes';
/**
    * Create a new draw API utilizing the Canvas's 2D API for rendering.
    *
    * @constructor
    * @param {CanvasElement} canvas the canvas object to render upon
    * @throws {Error} an error is thrown if Canvas's 2D API is unavailab
    */

/**
 * Create a new draw API utilizing the Canvas's 2D API for rendering.
 *
 * @constructor
 * @param {CanvasElement} canvas the canvas object to render upon
 * @throws {Error} an error is thrown if Canvas's 2D API is unavailab
 */
function Draw2D(canvas) {
    this.canvas = canvas;
    this.c2d = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.dimensions = [this.width, this.height];
    this.origin = [0, 0];

    if (!this.c2d) {
        throw new Error("Canvas 2d API unavailable.");
    }
}

Object.assign(Draw2D.prototype, EventEmitter.prototype);
eventHelpers.extend(Draw2D.prototype);

// Convert from logical to physical x coordinates
Draw2D.prototype.x = function (v) {
    return ((v - this.origin[0]) / this.dimensions[0]) * this.width;
};

// Convert from logical to physical y coordinates
Draw2D.prototype.y = function (v) {
    return this.height
        - ((v - this.origin[1]) / this.dimensions[1]) * this.height;
};

// Set the color to be used for drawing operations
Draw2D.prototype.setColor = function (color) {
    const mappedColor = color.map(function (c, i) {
        return i < 3 ? Math.floor(c * 255) : (c);
    }).join(',');
    this.c2d.strokeStyle = "rgba(" + mappedColor + ")";
    this.c2d.fillStyle = "rgba(" + mappedColor + ")";
};

Draw2D.prototype.clear = function () {
    this.width = this.canvas.width = this.canvas.offsetWidth;
    this.height = this.canvas.height = this.canvas.offsetHeight;
    this.c2d.clearRect(0, 0, this.width, this.height);
};

Draw2D.prototype.setDimensions = function (newDimensions, newOrigin) {
    this.dimensions = newDimensions;
    this.origin = newOrigin;
};

Draw2D.prototype.drawLine = function (buf, color, points) {
    let i;

    this.setColor(color);

    // Configure context to draw two-pixel-thick lines
    this.c2d.lineWidth = 1;

    // Start a new path...
    if (buf.length > 1) {
        this.c2d.beginPath();
        this.c2d.moveTo(this.x(buf[0]), this.y(buf[1]));
    }

    // ...and add points to it...
    for (i = 2; i < points * 2; i = i + 2) {
        this.c2d.lineTo(this.x(buf[i]), this.y(buf[i + 1]));
    }

    // ...before finally drawing it.
    this.c2d.stroke();
};

Draw2D.prototype.drawSquare = function (min, max, color) {
    const x1 = this.x(min[0]);
    const y1 = this.y(min[1]);
    const w = this.x(max[0]) - x1;
    const h = this.y(max[1]) - y1;

    this.setColor(color);
    this.c2d.fillRect(x1, y1, w, h);
};

Draw2D.prototype.drawPoints = function (
    buf,
    color,
    points,
    pointSize,
    shape
) {
    const drawC2DShape = MARKER_SHAPES[shape].drawC2D.bind(this);

    this.setColor(color);

    for (let i = 0; i < points; i++) {
        drawC2DShape(
            this.x(buf[i * 2]),
            this.y(buf[i * 2 + 1]),
            pointSize
        );
    }
};

Draw2D.prototype.drawLimitPoint = function (x, y, size) {
    this.c2d.fillRect(x + size, y, size, size);
    this.c2d.fillRect(x, y + size, size, size);
    this.c2d.fillRect(x - size, y, size, size);
    this.c2d.fillRect(x, y - size, size, size);
};

Draw2D.prototype.drawLimitPoints = function (points, color, pointSize) {
    const limitSize = pointSize * 2;
    const offset = limitSize / 2;

    this.setColor(color);

    for (let i = 0; i < points.length; i++) {
        this.drawLimitPoint(
            this.x(points[i].x) - offset,
            this.y(points[i].y) - offset,
            limitSize
        );
    }
};

export default Draw2D;
