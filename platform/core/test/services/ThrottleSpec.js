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
    ["../../src/services/Throttle"],
    function (Throttle) {

        describe("The 'throttle' service", function () {
            var throttle,
                mockTimeout,
                mockFn,
                mockPromise;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy("$timeout");
                mockPromise = jasmine.createSpyObj("promise", ["then"]);
                mockFn = jasmine.createSpy("fn");
                mockTimeout.and.returnValue(mockPromise);
                throttle = new Throttle(mockTimeout);
            });

            it("provides functions which run on a timeout", function () {
                var throttled = throttle(mockFn);
                // Verify precondition: Not called at throttle-time
                expect(mockTimeout).not.toHaveBeenCalled();
                expect(throttled()).toEqual(mockPromise);
                expect(mockFn).not.toHaveBeenCalled();
                expect(mockTimeout)
                    .toHaveBeenCalledWith(jasmine.any(Function), 0, false);
            });

            it("schedules only one timeout at a time", function () {
                var throttled = throttle(mockFn);
                throttled();
                throttled();
                throttled();
                expect(mockTimeout.calls.count()).toEqual(1);
            });

            it("schedules additional invocations after resolution", function () {
                var throttled = throttle(mockFn);
                throttled();
                mockTimeout.calls.mostRecent().args[0](); // Resolve timeout
                throttled();
                mockTimeout.calls.mostRecent().args[0]();
                throttled();
                mockTimeout.calls.mostRecent().args[0]();
                expect(mockTimeout.calls.count()).toEqual(3);
            });
        });
    }
);
