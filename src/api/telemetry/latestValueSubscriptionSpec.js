/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
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
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
define([
    './latestValueSubscription'
], function (
    latestValueSubscription
) {

    function slowPromise() {
        // Emprically, using setTimeout to resolve a promise results in a
        // promise that will resolve after every other promise.  This is a
        // simple way to defer code.
        return new Promise(function (resolve, reject) {
            setTimeout(resolve);
        });
    }

    describe("latestValueSubscription", function () {

        var openmct;
        var telemetryAPI;
        var telemetryMetadata;
        var formatMap;
        var pendingRequests;
        var subscriptions;
        var domainObject;
        var callback;
        var unsubscribe;
        var triggerTimeEvent;

        var noLADTestcases = [
            {
                name: "empty LAD",
                trigger: function () {
                    pendingRequests[0].resolve([]);
                }
            },
            {
                name: "rejected LAD",
                trigger: function () {
                    pendingRequests[0].reject();
                }
            }
        ];

        var outOfBoundsLADTestcases = [
            {
                name: "future LAD",
                trigger: function () {
                    pendingRequests[0].resolve([{test: 1123}]);
                }
            },
            {
                name: "prehistoric LAD",
                trigger: function () {
                    pendingRequests[0].resolve([{test: -150}]);
                }
            }
        ];


        beforeEach(function () {
            openmct = {
                time: jasmine.createSpyObj('timeAPI', [
                    'clock',
                    'timeSystem',
                    'bounds',
                    'on',
                    'off'
                ])
            };

            openmct.time.timeSystem.and.returnValue({key: 'test'});

            telemetryAPI = jasmine.createSpyObj('telemetryAPI', [
                'getMetadata',
                'getFormatMap',
                'request',
                'subscribe'
            ]);

            telemetryMetadata = jasmine.createSpyObj('metadata', [
                'values'
            ]);
            telemetryAPI.getMetadata.and.returnValue(telemetryMetadata);

            formatMap = {
                test: jasmine.createSpyObj('testFormatter', ['parse']),
                other: jasmine.createSpyObj('otherFormatter', ['parse'])
            };
            formatMap.test.parse.and.callFake(function (datum) {
                return datum.test;
            });
            formatMap.other.parse.and.callFake(function (datum) {
                return datum.other;
            });
            telemetryAPI.getFormatMap.and.returnValue(formatMap);

            pendingRequests = [];
            telemetryAPI.request.and.callFake(function (domainObject, options) {
                var request = {
                    domainObject: domainObject,
                    options: options
                };
                request.promise = new Promise(function (resolve, reject) {
                    request.resolve = resolve;
                    request.reject = reject;
                });
                pendingRequests.push(request);
                return request.promise;
            });

            subscriptions = [];
            telemetryAPI.subscribe.and.callFake(function (domainObject, callback) {
                var subscription = {
                    domainObject: domainObject,
                    callback: callback,
                    unsubscribe: jasmine.createSpy('unsubscribe')
                };
                subscriptions.push(subscription);
                return subscription.unsubscribe;
            });

            callback = jasmine.createSpy('callback');

            domainObject = {};

            triggerTimeEvent = function (event, args) {
                openmct.time.on.calls.allArgs().filter(function (callArgs) {
                    return callArgs[0] === event;
                })[0][1].apply(null, args);
            };
        });


        // A simple test case to make sure we have appropriate mocks.
        it("requests, subscribes, and unsubscribes", function () {
            var unsubscribe = latestValueSubscription(
                domainObject,
                callback,
                telemetryAPI,
                openmct
            );

            expect(unsubscribe).toEqual(jasmine.any(Function));
            expect(telemetryAPI.request)
                .toHaveBeenCalledWith(domainObject, jasmine.any(Object))
            expect(telemetryAPI.subscribe)
                .toHaveBeenCalledWith(domainObject, jasmine.any(Function))
            expect(subscriptions[0].unsubscribe).not.toHaveBeenCalled();

            unsubscribe();

            expect(subscriptions[0].unsubscribe).toHaveBeenCalled();
        });

        /** TODO:
         * test lad response inside bounds, outside bounds, no response.
         * test realtime should wait until lad response (all cases);
         * realtime should only notify if later than latest (or no latest).
         *
         * timesystem change should clear and re-request LAD.
         * clock change should enable/disable bounds filtering.
         * non-tick bounds change should clear and
         *
         *
         * should receive lad response
         * should receive realtime if later than lad.
         * should receive lad response (unless outside)
         * subscriptions should wait for lad response
         *
        */
        describe("no clock (AKA fixed)", function () {
            var unsubscribe;

            beforeEach(function () {
                openmct.time.clock.and.returnValue(undefined);
                openmct.time.timeSystem.and.returnValue({key: 'test'});
                openmct.time.bounds.and.returnValue({start: 0, end: 1000});
                unsubscribe = latestValueSubscription(
                    domainObject,
                    callback,
                    telemetryAPI,
                    openmct
                );
            });

            describe("nominal LAD response", function () {
                it("provides LAD datum on resolve", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        done();
                    });
                });

                it("sends realtime values synchronously after resolve", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        subscriptions[0].callback({test: 456})
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        done();
                    });
                });

                it("holds realtime values until resolved", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    subscriptions[0].callback({test: 456})
                    expect(callback).not.toHaveBeenCalledWith({test: 456});
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        done();
                    });
                });

                it("only sends latest realtime value after resolve", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    subscriptions[0].callback({test: 456});
                    subscriptions[0].callback({test: 567});
                    expect(callback).not.toHaveBeenCalledWith({test: 456});
                    expect(callback).not.toHaveBeenCalledWith({test: 567});
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        expect(callback).toHaveBeenCalledWith({test: 567});
                        done();
                    });
                });

                it("filters realtime values before latest", function (done) {
                    pendingRequests[0].resolve([{test: 456}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        subscriptions[0].callback({test: 123})
                        expect(callback).not.toHaveBeenCalledWith({test: 123});
                        done();
                    });
                });

                it("filters realtime values outside bounds", function (done) {
                    pendingRequests[0].resolve([{test: 456}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        subscriptions[0].callback({test: 1123})
                        expect(callback).not.toHaveBeenCalledWith({test: 1123});
                        done();
                    });
                });

                it("doesn't override pending value with one outside bounds", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    subscriptions[0].callback({test: 456});
                    subscriptions[0].callback({test: 1123});
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        expect(callback).not.toHaveBeenCalledWith({test: 1123});
                        done();
                    });
                });

                it("doesn't send out of order realtime value", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        subscriptions[0].callback({test: 567});
                        expect(callback).toHaveBeenCalledWith({test: 567});
                        subscriptions[0].callback({test: 456});
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        done();
                    });
                });
            });


            outOfBoundsLADTestcases.concat(noLADTestcases).forEach(function (testCase) {
                describe(testCase.name, function () {
                    it("does not provide LAD datum", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            expect(callback).not.toHaveBeenCalled();
                            done();
                        });
                    });

                    it("sends realtime values synchronously after resolve", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            subscriptions[0].callback({test: 456})
                            expect(callback).toHaveBeenCalledWith({test: 456});
                            done();
                        });
                    });

                    it("holds realtime values until resolved", function (done) {
                        testCase.trigger();
                        subscriptions[0].callback({test: 456})
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        slowPromise().then(function () {
                            expect(callback).toHaveBeenCalledWith({test: 456});
                            done();
                        });
                    });

                    it("only sends latest realtime value after resolve", function (done) {
                        testCase.trigger();
                        subscriptions[0].callback({test: 456});
                        subscriptions[0].callback({test: 567});
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        expect(callback).not.toHaveBeenCalledWith({test: 567});
                        slowPromise().then(function () {
                            expect(callback).not.toHaveBeenCalledWith({test: 456});
                            expect(callback).toHaveBeenCalledWith({test: 567});
                            done();
                        });
                    });

                    it("filters realtime values outside bounds", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            subscriptions[0].callback({test: 1123})
                            expect(callback).not.toHaveBeenCalledWith({test: 1123});
                            done();
                        });
                    });

                    it("doesn't override pending value with one outside bounds", function (done) {
                        testCase.trigger();
                        subscriptions[0].callback({test: 456});
                        subscriptions[0].callback({test: 1123});
                        slowPromise().then(function () {
                            expect(callback).toHaveBeenCalledWith({test: 456});
                            expect(callback).not.toHaveBeenCalledWith({test: 1123});
                            done();
                        });
                    });

                    it("doesn't send out of order realtime value", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            subscriptions[0].callback({test: 567});
                            expect(callback).toHaveBeenCalledWith({test: 567});
                            subscriptions[0].callback({test: 456});
                            expect(callback).not.toHaveBeenCalledWith({test: 456});
                            done();
                        });
                    });
                });
            });
        });

        describe("with clock (AKA realtime)", function () {

            beforeEach(function () {
                openmct.time.clock.and.returnValue({});
                openmct.time.timeSystem.and.returnValue({key: 'test'});
                openmct.time.bounds.and.returnValue({start: 0, end: 1000});
                unsubscribe = latestValueSubscription(
                    domainObject,
                    callback,
                    telemetryAPI,
                    openmct
                );
            });

            describe("nominal LAD response", function () {
                it("provides LAD datum on resolve", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        done();
                    });
                });

                it("sends realtime values synchronously after resolve", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        subscriptions[0].callback({test: 456})
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        done();
                    });
                });

                it("holds realtime values until resolved", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    subscriptions[0].callback({test: 456})
                    expect(callback).not.toHaveBeenCalledWith({test: 456});
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        done();
                    });
                });

                it("only sends latest realtime value after resolve", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    subscriptions[0].callback({test: 456});
                    subscriptions[0].callback({test: 567});
                    expect(callback).not.toHaveBeenCalledWith({test: 456});
                    expect(callback).not.toHaveBeenCalledWith({test: 567});
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        expect(callback).toHaveBeenCalledWith({test: 567});
                        done();
                    });
                });

                it("filters realtime values before latest", function (done) {
                    pendingRequests[0].resolve([{test: 456}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        subscriptions[0].callback({test: 123})
                        expect(callback).not.toHaveBeenCalledWith({test: 123});
                        done();
                    });
                });

                it("does not filter realtime values outside bounds", function (done) {
                    pendingRequests[0].resolve([{test: 456}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 456});
                        subscriptions[0].callback({test: 1123})
                        expect(callback).toHaveBeenCalledWith({test: 1123});
                        done();
                    });
                });

                it("overrides pending realtime value with one outside bounds", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    subscriptions[0].callback({test: 456});
                    subscriptions[0].callback({test: 1123});
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        expect(callback).toHaveBeenCalledWith({test: 1123});
                        done();
                    });
                });

                it("doesn't send out of order realtime value", function (done) {
                    pendingRequests[0].resolve([{test: 123}]);
                    slowPromise().then(function () {
                        expect(callback).toHaveBeenCalledWith({test: 123});
                        subscriptions[0].callback({test: 567});
                        expect(callback).toHaveBeenCalledWith({test: 567});
                        subscriptions[0].callback({test: 456});
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        done();
                    });
                });
            });

            noLADTestcases.forEach(function (testCase) {
                describe(testCase.name, function () {
                    it("does not provide LAD datum", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            expect(callback).not.toHaveBeenCalled();
                            done();
                        });
                    });

                    it("sends realtime values synchronously after resolve", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            subscriptions[0].callback({test: 456})
                            expect(callback).toHaveBeenCalledWith({test: 456});
                            done();
                        });
                    });

                    it("holds realtime values until resolved", function (done) {
                        testCase.trigger();
                        subscriptions[0].callback({test: 456})
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        slowPromise().then(function () {
                            expect(callback).toHaveBeenCalledWith({test: 456});
                            done();
                        });
                    });

                    it("only sends latest realtime value after resolve", function (done) {
                        testCase.trigger();
                        subscriptions[0].callback({test: 456});
                        subscriptions[0].callback({test: 567});
                        expect(callback).not.toHaveBeenCalledWith({test: 456});
                        expect(callback).not.toHaveBeenCalledWith({test: 567});
                        slowPromise().then(function () {
                            expect(callback).not.toHaveBeenCalledWith({test: 456});
                            expect(callback).toHaveBeenCalledWith({test: 567});
                            done();
                        });
                    });

                    it("doesn't filter realtime values outside bounds", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            subscriptions[0].callback({test: 1123})
                            expect(callback).toHaveBeenCalledWith({test: 1123});
                            done();
                        });
                    });

                    it("doesn't filter pending realtime values outside bounds", function (done) {
                        testCase.trigger();
                        subscriptions[0].callback({test: 456});
                        subscriptions[0].callback({test: 1123});
                        slowPromise().then(function () {
                            expect(callback).not.toHaveBeenCalledWith({test: 456});
                            expect(callback).toHaveBeenCalledWith({test: 1123});
                            done();
                        });
                    });

                    it("doesn't send out of order realtime value", function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            subscriptions[0].callback({test: 567});
                            expect(callback).toHaveBeenCalledWith({test: 567});
                            subscriptions[0].callback({test: 456});
                            expect(callback).not.toHaveBeenCalledWith({test: 456});
                            done();
                        });
                    });
                });
            });

            describe("out of bounds LAD", function () {
                outOfBoundsLADTestcases.forEach(function (testCase) {
                    it(`provides ${testCase} datum`, function (done) {
                        testCase.trigger();
                        slowPromise().then(function () {
                            expect(callback).toHaveBeenCalled();
                            done();
                        });
                    });
                });
            });
        });

        describe("clock changes", function () {

            beforeEach(function () {
                openmct.time.timeSystem.and.returnValue({key: 'test'});
                openmct.time.bounds.and.returnValue({start: 0, end: 1000});
            });

            it("starts bounds filtering when clock is cleared", function (done) {
                openmct.time.clock.and.returnValue({});
                unsubscribe = latestValueSubscription(
                    domainObject,
                    callback,
                    telemetryAPI,
                    openmct
                );
                pendingRequests[0].resolve([]);
                slowPromise().then(function () {
                    subscriptions[0].callback({test: 1123});
                    expect(callback).toHaveBeenCalledWith({test: 1123});
                    triggerTimeEvent('clock', undefined);
                    subscriptions[0].callback({test: 1223});
                    expect(callback).not.toHaveBeenCalledWith({test: 1223});
                    done();
                });
            });

            it("stops bounds filtering when clock is set", function (done) {
                openmct.time.clock.and.returnValue(undefined);
                unsubscribe = latestValueSubscription(
                    domainObject,
                    callback,
                    telemetryAPI,
                    openmct
                );
                pendingRequests[0].resolve([]);
                slowPromise().then(function () {
                    subscriptions[0].callback({test: 1123});
                    expect(callback).not.toHaveBeenCalledWith({test: 1123});
                    triggerTimeEvent('clock', [{}]);
                    subscriptions[0].callback({test: 1223});
                    expect(callback).toHaveBeenCalledWith({test: 1223});
                    done();
                });
            });
        });

        describe("timesystem changes", function () {
            it("requeries lad and uses new keys.", function (done) {
                openmct.time.clock.and.returnValue(undefined);
                openmct.time.timeSystem.and.returnValue({key: 'test'});
                openmct.time.bounds.and.returnValue({start: 0, end: 1000});
                unsubscribe = latestValueSubscription(
                    domainObject,
                    callback,
                    telemetryAPI,
                    openmct
                );

                expect(pendingRequests.length).toBe(1);
                expect(subscriptions.length).toBe(1);
                pendingRequests[0].resolve([{test: 234}]);
                slowPromise().then(function () {
                    expect(callback).toHaveBeenCalledWith({test: 234});
                    triggerTimeEvent('timeSystem', [{key: 'other'}]);
                    expect(pendingRequests.length).toBe(2);
                    expect(subscriptions.length).toBe(1);
                    pendingRequests[1].resolve([{test: 123, other: 456}]);
                    return slowPromise(); // wait for new lad to resolve.
                }).then(function() {
                    expect(callback).toHaveBeenCalledWith({test: 123, other: 456});
                    // should have synchronous callbacks when other is greater.
                    subscriptions[0].callback({test: 234, other: 567});
                    expect(callback).toHaveBeenCalledWith({test: 234, other:567});
                    // should filter out when other is less.
                    subscriptions[0].callback({test: 345, other: 345});
                    expect(callback).not.toHaveBeenCalledWith({test: 345, other: 345});
                    done();
                });
            });
        });

        it("does not filter when no value matches timesystem", function (done) {
            openmct.time.clock.and.returnValue(undefined);
            openmct.time.timeSystem.and.returnValue({key: 'blah'});
            openmct.time.bounds.and.returnValue({start: 0, end: 1000});
            unsubscribe = latestValueSubscription(
                domainObject,
                callback,
                telemetryAPI,
                openmct
            );
            pendingRequests[0].resolve([{test: 1234}]);
            slowPromise().then(function () {
                expect(callback).toHaveBeenCalledWith({test: 1234});
                subscriptions[0].callback({test: 567});
                expect(callback).toHaveBeenCalledWith({test: 567});
                done();
            });

        });

        describe("on bounds event", function () {
            // TODO: test cases for what happens when bounds changes.
        });
    });

});
