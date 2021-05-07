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

import LocalClock from './LocalClock.js';
import UTCTimeSystem from './UTCTimeSystem';
import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

describe("The UTC Time System", () => {
    const UTC_SYSTEM_AND_FORMAT_KEY = 'utc';
    let openmct;
    let utcTimeSystem;
    let mockTimeout;

    beforeEach(() => {
        openmct = createOpenMct();
        openmct.install(openmct.plugins.UTCTimeSystem());
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe("plugin", function () {

        beforeEach(function () {
            mockTimeout = jasmine.createSpy("timeout");
            utcTimeSystem = new UTCTimeSystem(mockTimeout);
        });

        it("is installed", () => {
            let timeSystems = openmct.time.getAllTimeSystems();
            let utc = timeSystems.find(ts => ts.key === UTC_SYSTEM_AND_FORMAT_KEY);

            expect(utc).not.toEqual(-1);
        });

        it("can be set to be the main time system", () => {
            openmct.time.timeSystem(UTC_SYSTEM_AND_FORMAT_KEY, {
                start: 0,
                end: 4
            });

            expect(openmct.time.timeSystem().key).toBe(UTC_SYSTEM_AND_FORMAT_KEY);
        });

        it("uses the utc time format", () => {
            expect(utcTimeSystem.timeFormat).toBe(UTC_SYSTEM_AND_FORMAT_KEY);
        });

        it("is UTC based", () => {
            expect(utcTimeSystem.isUTCBased).toBe(true);
        });

        it("defines expected metadata", () => {
            expect(utcTimeSystem.key).toBe(UTC_SYSTEM_AND_FORMAT_KEY);
            expect(utcTimeSystem.name).toBeDefined();
            expect(utcTimeSystem.cssClass).toBeDefined();
            expect(utcTimeSystem.durationFormat).toBeDefined();
        });
    });

    describe("LocalClock class", function () {
        let clock;
        const timeoutHandle = {};

        beforeEach(function () {
            mockTimeout = jasmine.createSpy("timeout");
            mockTimeout.and.returnValue(timeoutHandle);

            clock = new LocalClock(0);
            clock.start();
        });

        it("calls listeners on tick with current time", function () {
            const mockListener = jasmine.createSpy("listener");
            clock.on('tick', mockListener);
            clock.tick();
            expect(mockListener).toHaveBeenCalledWith(jasmine.any(Number));
        });
    });
});
