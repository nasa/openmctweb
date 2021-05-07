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

define(['./TimeAPI'], function (TimeAPI) {
    describe("The Time API", function () {
        let api;
        let timeSystemKey;
        let timeSystem;
        let clockKey;
        let clock;
        let bounds;
        let eventListener;
        let toi;

        beforeEach(function () {
            api = new TimeAPI();
            timeSystemKey = "timeSystemKey";
            timeSystem = {key: timeSystemKey};
            clockKey = "someClockKey";
            clock = jasmine.createSpyObj("clock", [
                "on",
                "off",
                "currentValue"
            ]);
            clock.currentValue.and.returnValue(100);
            clock.key = clockKey;
            bounds = {
                start: 0,
                end: 1
            };
            eventListener = jasmine.createSpy("eventListener");
            toi = 111;
        });

        it("Supports setting and querying of time of interest", function () {
            expect(api.timeOfInterest()).not.toBe(toi);
            api.timeOfInterest(toi);
            expect(api.timeOfInterest()).toBe(toi);
        });

        it("Allows setting of valid bounds", function () {
            bounds = {
                start: 0,
                end: 1
            };
            expect(api.bounds()).not.toBe(bounds);
            expect(api.bounds.bind(api, bounds)).not.toThrow();
            expect(api.bounds()).toEqual(bounds);
        });

        it("Disallows setting of invalid bounds", function () {
            bounds = {
                start: 1,
                end: 0
            };
            expect(api.bounds()).not.toEqual(bounds);
            expect(api.bounds.bind(api, bounds)).toThrow();
            expect(api.bounds()).not.toEqual(bounds);

            bounds = {start: 1};
            expect(api.bounds()).not.toEqual(bounds);
            expect(api.bounds.bind(api, bounds)).toThrow();
            expect(api.bounds()).not.toEqual(bounds);
        });

        it("Allows setting of previously registered time system with bounds", function () {
            api.addTimeSystem(timeSystem);
            expect(api.timeSystem()).not.toBe(timeSystem);
            expect(function () {
                api.timeSystem(timeSystem, bounds);
            }).not.toThrow();
            expect(api.timeSystem()).toBe(timeSystem);
        });

        it("Disallows setting of time system without bounds", function () {
            api.addTimeSystem(timeSystem);
            expect(api.timeSystem()).not.toBe(timeSystem);
            expect(function () {
                api.timeSystem(timeSystemKey);
            }).toThrow();
            expect(api.timeSystem()).not.toBe(timeSystem);
        });

        it("allows setting of timesystem without bounds with clock", function () {
            api.addTimeSystem(timeSystem);
            api.addClock(clock);
            api.clock(clockKey, {
                start: 0,
                end: 1
            });
            expect(api.timeSystem()).not.toBe(timeSystem);
            expect(function () {
                api.timeSystem(timeSystemKey);
            }).not.toThrow();
            expect(api.timeSystem()).toBe(timeSystem);

        });

        it("Emits an event when time system changes", function () {
            api.addTimeSystem(timeSystem);
            expect(eventListener).not.toHaveBeenCalled();
            api.on("timeSystem", eventListener);
            api.timeSystem(timeSystemKey, bounds);
            expect(eventListener).toHaveBeenCalledWith(timeSystem);
        });

        it("Emits an event when time of interest changes", function () {
            expect(eventListener).not.toHaveBeenCalled();
            api.on("timeOfInterest", eventListener);
            api.timeOfInterest(toi);
            expect(eventListener).toHaveBeenCalledWith(toi);
        });

        it("Emits an event when bounds change", function () {
            expect(eventListener).not.toHaveBeenCalled();
            api.on("bounds", eventListener);
            api.bounds(bounds);
            expect(eventListener).toHaveBeenCalledWith(bounds, false);
        });

        it("If bounds are set and TOI lies inside them, do not change TOI", function () {
            api.timeOfInterest(6);
            api.bounds({
                start: 1,
                end: 10
            });
            expect(api.timeOfInterest()).toEqual(6);
        });

        it("If bounds are set and TOI lies outside them, reset TOI", function () {
            api.timeOfInterest(11);
            api.bounds({
                start: 1,
                end: 10
            });
            expect(api.timeOfInterest()).toBeUndefined();
        });

        it("Maintains delta during tick", function () {
        });

        it("Allows registered time system to be activated", function () {
        });

        it("Allows a registered tick source to be activated", function () {
            const mockTickSource = jasmine.createSpyObj("mockTickSource", [
                "on",
                "off",
                "currentValue"
            ]);
            mockTickSource.key = 'mockTickSource';
        });

        describe(" when enabling a tick source", function () {
            let mockTickSource;
            let anotherMockTickSource;
            const mockOffsets = {
                start: 0,
                end: 1
            };

            beforeEach(function () {
                mockTickSource = jasmine.createSpyObj("clock", [
                    "on",
                    "off",
                    "currentValue"
                ]);
                mockTickSource.currentValue.and.returnValue(10);
                mockTickSource.key = "mts";

                anotherMockTickSource = jasmine.createSpyObj("clock", [
                    "on",
                    "off",
                    "currentValue"
                ]);
                anotherMockTickSource.key = "amts";
                anotherMockTickSource.currentValue.and.returnValue(10);

                api.addClock(mockTickSource);
                api.addClock(anotherMockTickSource);
            });

            it("sets bounds based on current value", function () {
                api.clock("mts", mockOffsets);
                expect(api.bounds()).toEqual({
                    start: 10,
                    end: 11
                });
            });

            it("a new tick listener is registered", function () {
                api.clock("mts", mockOffsets);
                expect(mockTickSource.on).toHaveBeenCalledWith("tick", jasmine.any(Function));
            });

            it("listener of existing tick source is reregistered", function () {
                api.clock("mts", mockOffsets);
                api.clock("amts", mockOffsets);
                expect(mockTickSource.off).toHaveBeenCalledWith("tick", jasmine.any(Function));
            });

            it("Allows the active clock to be set and unset", function () {
                expect(api.clock()).toBeUndefined();
                api.clock("mts", mockOffsets);
                expect(api.clock()).toBeDefined();
                api.stopClock();
                expect(api.clock()).toBeUndefined();
            });

        });

        it("on tick, observes offsets, and indicates tick in bounds callback", function () {
            const mockTickSource = jasmine.createSpyObj("clock", [
                "on",
                "off",
                "currentValue"
            ]);
            mockTickSource.currentValue.and.returnValue(100);
            let tickCallback;
            const boundsCallback = jasmine.createSpy("boundsCallback");
            const clockOffsets = {
                start: -100,
                end: 100
            };
            mockTickSource.key = "mts";

            api.addClock(mockTickSource);
            api.clock("mts", clockOffsets);

            api.on("bounds", boundsCallback);

            tickCallback = mockTickSource.on.calls.mostRecent().args[1];
            tickCallback(1000);
            expect(boundsCallback).toHaveBeenCalledWith({
                start: 900,
                end: 1100
            }, true);
        });
    });
});
