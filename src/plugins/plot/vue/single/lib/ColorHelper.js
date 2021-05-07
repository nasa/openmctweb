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

export const COLOR_PALETTE = [
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

export function isDefaultColor(color) {
    const a = color.asIntegerArray();

    return COLOR_PALETTE.some(function (b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    });
}
