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

import MCTChartSeriesElement from './MCTChartSeriesElement';

export default class MCTChartLineStepAfter extends MCTChartSeriesElement {
    removePoint(point, index, count) {
        if (index > 0 && index / 2 < this.count) {
            this.buffer[index + 1] = this.buffer[index - 1];
        }
    }

    vertexCountForPointAtIndex(index) {
        if (index === 0 && this.count === 0) {
            return 2;
        }

        return 4;
    }

    startIndexForPointAtIndex(index) {
        if (index === 0) {
            return 0;
        }

        return 2 + ((index - 1) * 4);
    }

    addPoint(point, start, count) {
        if (start === 0 && this.count === 0) {
            // First point is easy.
            this.buffer[start] = point.x;
            this.buffer[start + 1] = point.y; // one point
        } else if (start === 0 && this.count > 0) {
            // Unshifting requires adding an extra point.
            this.buffer[start] = point.x;
            this.buffer[start + 1] = point.y;
            this.buffer[start + 2] = this.buffer[start + 4];
            this.buffer[start + 3] = point.y;
        } else {
            // Appending anywhere in line, insert standard two points.
            this.buffer[start] = point.x;
            this.buffer[start + 1] = this.buffer[start - 1];
            this.buffer[start + 2] = point.x;
            this.buffer[start + 3] = point.y;

            if (start < this.count * 2) {
                // Insert into the middle, need to update the following
                // point.
                this.buffer[start + 5] = point.y;
            }
        }
    }
}

