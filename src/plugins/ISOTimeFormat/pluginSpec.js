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

import ISOTimeFormat from './ISOTimeFormat.js';

describe("the plugin", () => {
    const ISO_KEY = 'iso';
    const JUNK = "junk";
    const MOON_LANDING_TIMESTAMP = -14256000000;
    const MOON_LANDING_DATESTRING = '1969-07-20T00:00:00.000Z';
    let isoFormatter;

    beforeEach(() => {
        isoFormatter = new ISOTimeFormat();
    });

    describe("creates a new ISO based formatter", function () {

        it("with the key 'iso'", () => {
            expect(isoFormatter.key).toBe(ISO_KEY);
        });

        it("that will format a timestamp in ISO standard format", () => {
            expect(isoFormatter.format(MOON_LANDING_TIMESTAMP)).toBe(MOON_LANDING_DATESTRING);
        });

        it("that will parse an ISO Date String into milliseconds", () => {
            expect(isoFormatter.parse(MOON_LANDING_DATESTRING)).toBe(MOON_LANDING_TIMESTAMP);
        });

        it("that will validate correctly", () => {
            expect(isoFormatter.validate(MOON_LANDING_DATESTRING)).toBe(true);
            expect(isoFormatter.validate(JUNK)).toBe(false);
        });
    });
});
