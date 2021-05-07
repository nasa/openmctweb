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

import moment from 'moment';

export default function multiFormat(date) {
    const momentified = moment.utc(date);
    /**
     * Uses logic from d3 Time-Scales, v3 of the API. See
     * https://github.com/d3/d3-3.x-api-reference/blob/master/Time-Scales.md
     *
     * Licensed
     */
    const format = [
        [".SSS", function (m) {
            return m.milliseconds();
        }],
        [":ss", function (m) {
            return m.seconds();
        }],
        ["HH:mm", function (m) {
            return m.minutes();
        }],
        ["HH:mm", function (m) {
            return m.hours();
        }],
        ["ddd DD", function (m) {
            return m.days()
                && m.date() !== 1;
        }],
        ["MMM DD", function (m) {
            return m.date() !== 1;
        }],
        ["MMMM", function (m) {
            return m.month();
        }],
        ["YYYY", function () {
            return true;
        }]
    ].filter(function (row) {
        return row[1](momentified);
    })[0][0];

    if (format !== undefined) {
        return moment.utc(date).format(format);
    }
}
