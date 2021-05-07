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
import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

describe("The URLTimeSettingsSynchronizer", () => {
    let openmct;
    let testClock;

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(openmct.plugins.LocalTimeSystem());
        testClock = jasmine.createSpyObj("testClock", ["start", "stop", "tick", "currentValue", "on", "off"]);
        testClock.key = "test-clock";
        testClock.currentValue.and.returnValue(0);

        openmct.time.addClock(testClock);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => resetApplicationState(openmct));

    describe("realtime mode", () => {
        it("when the clock is set via the time API, it is immediately reflected in the URL", () => {
            //Test expected initial conditions
            expect(window.location.hash.includes('tc.mode=fixed')).toBe(true);

            openmct.time.clock('local', {
                start: -1000,
                end: 100
            });

            expect(window.location.hash.includes('tc.mode=local')).toBe(true);

            //Test that expected initial conditions are no longer true
            expect(window.location.hash.includes('tc.mode=fixed')).toBe(false);
        });
        it("when offsets are set via the time API, they are immediately reflected in the URL", () => {
            //Test expected initial conditions
            expect(window.location.hash.includes('tc.startDelta')).toBe(false);
            expect(window.location.hash.includes('tc.endDelta')).toBe(false);

            openmct.time.clock('local', {
                start: -1000,
                end: 100
            });
            expect(window.location.hash.includes('tc.startDelta=1000')).toBe(true);
            expect(window.location.hash.includes('tc.endDelta=100')).toBe(true);

            openmct.time.clockOffsets({
                start: -2000,
                end: 200
            });
            expect(window.location.hash.includes('tc.startDelta=2000')).toBe(true);
            expect(window.location.hash.includes('tc.endDelta=200')).toBe(true);

            //Test that expected initial conditions are no longer true
            expect(window.location.hash.includes('tc.mode=fixed')).toBe(false);
        });
        describe("when set in the url", () => {
            it("will change from fixed to realtime mode when the mode changes", () => {
                expectLocationToBeInFixedMode();

                return switchToRealtimeMode().then(() => {
                    let clock = openmct.time.clock();

                    expect(clock).toBeDefined();
                    expect(clock.key).toBe('local');
                });
            });
            it("the clock is correctly set in the API from the URL parameters", () => {
                return switchToRealtimeMode().then(() => {
                    let resolveFunction;

                    return new Promise((resolve) => {
                        resolveFunction = resolve;

                        //The 'hashchange' event appears to be asynchronous, so we need to wait until a clock change has been
                        //detected in the API.
                        openmct.time.on('clock', resolveFunction);
                        let hash = window.location.hash;
                        hash = hash.replace('tc.mode=local', 'tc.mode=test-clock');
                        window.location.hash = hash;
                    }).then(() => {
                        let clock = openmct.time.clock();
                        expect(clock).toBeDefined();
                        expect(clock.key).toBe('test-clock');
                        openmct.time.off('clock', resolveFunction);
                    });
                });
            });
            it("the clock offsets are correctly set in the API from the URL parameters", () => {
                return switchToRealtimeMode().then(() => {
                    let resolveFunction;

                    return new Promise((resolve) => {
                        resolveFunction = resolve;
                        //The 'hashchange' event appears to be asynchronous, so we need to wait until a clock change has been
                        //detected in the API.
                        openmct.time.on('clockOffsets', resolveFunction);
                        let hash = window.location.hash;
                        hash = hash.replace('tc.startDelta=1000', 'tc.startDelta=2000');
                        hash = hash.replace('tc.endDelta=100', 'tc.endDelta=200');
                        window.location.hash = hash;
                    }).then(() => {
                        let clockOffsets = openmct.time.clockOffsets();
                        expect(clockOffsets).toBeDefined();
                        expect(clockOffsets.start).toBe(-2000);
                        expect(clockOffsets.end).toBe(200);
                        openmct.time.off('clockOffsets', resolveFunction);
                    });
                });
            });
            it("the time system is correctly set in the API from the URL parameters", () => {
                return switchToRealtimeMode().then(() => {
                    let resolveFunction;

                    return new Promise((resolve) => {
                        resolveFunction = resolve;

                        //The 'hashchange' event appears to be asynchronous, so we need to wait until a clock change has been
                        //detected in the API.
                        openmct.time.on('timeSystem', resolveFunction);
                        let hash = window.location.hash;
                        hash = hash.replace('tc.timeSystem=utc', 'tc.timeSystem=local');
                        window.location.hash = hash;
                    }).then(() => {
                        let timeSystem = openmct.time.timeSystem();
                        expect(timeSystem).toBeDefined();
                        expect(timeSystem.key).toBe('local');
                        openmct.time.off('timeSystem', resolveFunction);
                    });
                });
            });
        });
    });
    describe("fixed timespan mode", () => {
        beforeEach(() => {
            openmct.time.stopClock();
            openmct.time.timeSystem('utc', {
                start: 0,
                end: 1
            });
        });

        it("when bounds are set via the time API, they are immediately reflected in the URL", () => {
            //Test expected initial conditions
            expect(window.location.hash.includes('tc.startBound=0')).toBe(true);
            expect(window.location.hash.includes('tc.endBound=1')).toBe(true);

            openmct.time.bounds({
                start: 10,
                end: 20
            });

            expect(window.location.hash.includes('tc.startBound=10')).toBe(true);
            expect(window.location.hash.includes('tc.endBound=20')).toBe(true);

            //Test that expected initial conditions are no longer true
            expect(window.location.hash.includes('tc.startBound=0')).toBe(false);
            expect(window.location.hash.includes('tc.endBound=1')).toBe(false);
        });

        it("when time system is set via the time API, it is immediately reflected in the URL", () => {
            //Test expected initial conditions
            expect(window.location.hash.includes('tc.timeSystem=utc')).toBe(true);

            openmct.time.timeSystem('local', {
                start: 20,
                end: 30
            });

            expect(window.location.hash.includes('tc.timeSystem=local')).toBe(true);

            //Test that expected initial conditions are no longer true
            expect(window.location.hash.includes('tc.timeSystem=utc')).toBe(false);
        });
        describe("when set in the url", () => {
            it("time system changes are reflected in the API", () => {
                let resolveFunction;

                return new Promise((resolve) => {
                    let timeSystem = openmct.time.timeSystem();
                    resolveFunction = resolve;

                    expect(timeSystem.key).toBe('utc');
                    window.location.hash = window.location.hash.replace('tc.timeSystem=utc', 'tc.timeSystem=local');

                    openmct.time.on('timeSystem', resolveFunction);
                }).then(() => {
                    let timeSystem = openmct.time.timeSystem();
                    expect(timeSystem.key).toBe('local');

                    openmct.time.off('timeSystem', resolveFunction);
                });
            });
            it("mode can be changed from realtime to fixed", () => {
                return switchToRealtimeMode().then(() => {
                    expectLocationToBeInRealtimeMode();

                    expect(openmct.time.clock()).toBeDefined();
                }).then(switchToFixedMode).then(() => {
                    let clock = openmct.time.clock();
                    expect(clock).not.toBeDefined();
                });
            });
            it("bounds are correctly set in the API from the URL parameters", () => {
                let resolveFunction;

                expectLocationToBeInFixedMode();

                return new Promise((resolve) => {
                    resolveFunction = resolve;
                    openmct.time.on('bounds', resolveFunction);
                    let hash = window.location.hash;
                    hash = hash.replace('tc.startBound=0', 'tc.startBound=222')
                        .replace('tc.endBound=1', 'tc.endBound=333');
                    window.location.hash = hash;
                }).then(() => {
                    let bounds = openmct.time.bounds();

                    expect(bounds).toBeDefined();
                    expect(bounds.start).toBe(222);
                    expect(bounds.end).toBe(333);
                });
            });
            it("bounds are correctly set in the API from the URL parameters where only the end bound changes", () => {
                let resolveFunction;

                expectLocationToBeInFixedMode();

                return new Promise((resolve) => {
                    resolveFunction = resolve;
                    openmct.time.on('bounds', resolveFunction);
                    let hash = window.location.hash;
                    hash = hash.replace('tc.endBound=1', 'tc.endBound=333');
                    window.location.hash = hash;
                }).then(() => {
                    let bounds = openmct.time.bounds();

                    expect(bounds).toBeDefined();
                    expect(bounds.start).toBe(0);
                    expect(bounds.end).toBe(333);
                });
            });
        });
    });

    function setRealtimeLocationParameters() {
        let hash = window.location.hash.toString()
            .replace('tc.mode=fixed', 'tc.mode=local')
            .replace('tc.startBound=0', 'tc.startDelta=1000')
            .replace('tc.endBound=1', 'tc.endDelta=100');

        window.location.hash = hash;
    }

    function setFixedLocationParameters() {
        let hash = window.location.hash.toString()
            .replace('tc.mode=local', 'tc.mode=fixed')
            .replace('tc.timeSystem=utc', 'tc.timeSystem=local')
            .replace('tc.startDelta=1000', 'tc.startBound=50')
            .replace('tc.endDelta=100', 'tc.endBound=60');

        window.location.hash = hash;
    }

    function switchToRealtimeMode() {
        let resolveFunction;

        return new Promise((resolve) => {
            resolveFunction = resolve;
            openmct.time.on('clock', resolveFunction);
            setRealtimeLocationParameters();
        }).then(() => {
            openmct.time.off('clock', resolveFunction);
        });
    }

    function switchToFixedMode() {
        let resolveFunction;

        return new Promise((resolve) => {
            resolveFunction = resolve;
            //The 'hashchange' event appears to be asynchronous, so we need to wait until a clock change has been
            //detected in the API.
            openmct.time.on('clock', resolveFunction);
            setFixedLocationParameters();
        }).then(() => {
            openmct.time.off('clock', resolveFunction);
        });
    }

    function expectLocationToBeInRealtimeMode() {
        expect(window.location.hash.includes('tc.mode=local')).toBe(true);
        expect(window.location.hash.includes('tc.startDelta=1000')).toBe(true);
        expect(window.location.hash.includes('tc.endDelta=100')).toBe(true);
        expect(window.location.hash.includes('tc.mode=fixed')).toBe(false);
    }

    function expectLocationToBeInFixedMode() {
        expect(window.location.hash.includes('tc.mode=fixed')).toBe(true);
        expect(window.location.hash.includes('tc.startBound=0')).toBe(true);
        expect(window.location.hash.includes('tc.endBound=1')).toBe(true);
        expect(window.location.hash.includes('tc.mode=local')).toBe(false);
    }
});
