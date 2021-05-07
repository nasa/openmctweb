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
    ["../src/TelemetrySubscription"],
    function (TelemetrySubscription) {

        describe("A telemetry subscription", function () {
            var mockQ,
                mockTimeout,
                mockDomainObject,
                mockCallback,
                mockTelemetry,
                mockMutation,
                mockUnsubscribe,
                mockUnlisten,
                mockSeries,
                testMetadata,
                subscription;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                testMetadata = { someKey: "some value" };

                mockQ = jasmine.createSpyObj("$q", ["when", "all"]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "useCapability", "hasCapability", "getId"]
                );
                mockCallback = jasmine.createSpy("callback");
                mockTelemetry = jasmine.createSpyObj(
                    "telemetry",
                    ["subscribe", "getMetadata"]
                );
                mockMutation = jasmine.createSpyObj(
                    "mutation",
                    ["mutate", "listen"]
                );
                mockUnsubscribe = jasmine.createSpy("unsubscribe");
                mockUnlisten = jasmine.createSpy("unlisten");
                mockSeries = jasmine.createSpyObj(
                    "series",
                    ["getPointCount", "getDomainValue", "getRangeValue"]
                );

                mockQ.when.and.callFake(mockPromise);

                mockDomainObject.hasCapability.and.returnValue(true);
                mockDomainObject.getCapability.and.callFake(function (c) {
                    return {
                        telemetry: mockTelemetry,
                        mutation: mockMutation
                    }[c];
                });
                mockDomainObject.getId.and.returnValue('test-id');

                mockTelemetry.subscribe.and.returnValue(mockUnsubscribe);
                mockTelemetry.getMetadata.and.returnValue(testMetadata);

                mockMutation.listen.and.returnValue(mockUnlisten);

                mockSeries.getPointCount.and.returnValue(42);
                mockSeries.getDomainValue.and.returnValue(123456);
                mockSeries.getRangeValue.and.returnValue(789);

                subscription = new TelemetrySubscription(
                    mockQ,
                    mockTimeout,
                    mockDomainObject,
                    mockCallback
                );
            });

            it("subscribes to the provided object", function () {
                expect(mockTelemetry.subscribe).toHaveBeenCalled();
            });

            it("unsubscribes on request", function () {
                expect(mockUnsubscribe).not.toHaveBeenCalled();
                subscription.unsubscribe();
                expect(mockUnsubscribe).toHaveBeenCalled();
            });

            it("fires callbacks when subscriptions update", function () {
                // Callback fires when telemetry objects become available,
                // so track initial call count instead of verifying that
                // it hasn't been called at all.
                var initialCalls = mockCallback.calls.count();
                mockTelemetry.subscribe.calls.mostRecent().args[0](mockSeries);
                // This gets fired via a timeout, so trigger that
                expect(mockTimeout).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    0
                );
                mockTimeout.calls.mostRecent().args[0]();
                // Should have triggered the callback to alert that
                // new data was available
                expect(mockCallback.calls.count()).toEqual(initialCalls + 1);
            });

            it("fires subscription callbacks once per cycle", function () {
                var i;

                // Verify precondition - one call for telemetryObjects
                expect(mockCallback.calls.count()).toEqual(1);

                for (i = 0; i < 100; i += 1) {
                    mockTelemetry.subscribe.calls.mostRecent().args[0](mockSeries);
                }

                // This gets fired via a timeout, so trigger any of those
                mockTimeout.calls.all().forEach(function (call) {
                    call.args[0]();
                });
                // Should have only triggered the
                expect(mockCallback.calls.count()).toEqual(2);
            });

            it("reports its latest observed data values", function () {
                mockTelemetry.subscribe.calls.mostRecent().args[0](mockSeries);
                // This gets fired via a timeout, so trigger that
                mockTimeout.calls.mostRecent().args[0]();
                // Verify that the last sample was looked at
                expect(mockSeries.getDomainValue).toHaveBeenCalledWith(41);
                expect(mockSeries.getRangeValue).toHaveBeenCalledWith(41);
                // Domain and range values should now be available
                expect(subscription.getDomainValue(mockDomainObject))
                    .toEqual(123456);
                expect(subscription.getRangeValue(mockDomainObject))
                    .toEqual(789);
            });

            it("provides no objects if no domain object is provided", function () {
                // omit last arguments
                subscription = new TelemetrySubscription(mockQ, mockTimeout);

                // Should have no objects
                expect(subscription.getTelemetryObjects()).toEqual([]);
            });

            // This test case corresponds to plot usage of
            // telemetrySubscription, where failure to callback
            // once-per-update results in loss of data, WTD-784
            it("fires one event per update if requested", function () {
                var i, domains = [], ranges = [], lastCall, initialCalls;

                // Clear out the subscription from beforeEach
                subscription.unsubscribe();
                // Create a subscription which does not drop events
                subscription = new TelemetrySubscription(
                    mockQ,
                    mockTimeout,
                    mockDomainObject,
                    mockCallback,
                    true // Don't drop updates!
                );

                // Track calls at this point
                initialCalls = mockCallback.calls.count();

                // Snapshot getDomainValue, getRangeValue at time of callback
                mockCallback.and.callFake(function () {
                    domains.push(subscription.getDomainValue(mockDomainObject));
                    ranges.push(subscription.getRangeValue(mockDomainObject));
                });

                // Send 100 updates
                for (i = 0; i < 100; i += 1) {
                    // Return different values to verify later
                    mockSeries.getDomainValue.and.returnValue(i);
                    mockSeries.getRangeValue.and.returnValue(i * 2);
                    mockTelemetry.subscribe.calls.mostRecent().args[0](mockSeries);
                }

                // Fire all timeouts that get scheduled
                while (mockTimeout.calls.mostRecent() !== lastCall) {
                    lastCall = mockTimeout.calls.mostRecent();
                    lastCall.args[0]();
                }

                // Should have only triggered the
                expect(mockCallback.calls.count()).toEqual(100 + initialCalls);
            });

            it("provides domain object metadata", function () {
                expect(subscription.getMetadata()[0])
                    .toEqual(testMetadata);
            });

            it("fires callback when telemetry objects are available", function () {
                expect(mockCallback.calls.count()).toEqual(1);
            });

            it("exposes a promise for telemetry objects", function () {
                var mockCallback2 = jasmine.createSpy('callback');
                subscription.promiseTelemetryObjects().then(mockCallback2);

                expect(mockCallback2)
                    .toHaveBeenCalledWith([mockDomainObject]);
            });

            it("reinitializes on mutation", function () {
                expect(mockTelemetry.subscribe.calls.count()).toEqual(1);
                // Notify of a mutation which appears to change composition
                mockMutation.listen.calls.mostRecent().args[0]({
                    composition: ['Z']
                });
                // Use subscribe call as an indication of reinitialization
                expect(mockTelemetry.subscribe.calls.count()).toEqual(2);
            });

            it("stops listening for mutation on unsubscribe", function () {
                expect(mockUnlisten).not.toHaveBeenCalled();
                subscription.unsubscribe();
                expect(mockUnlisten).toHaveBeenCalled();
            });

            it("provides telemetry as datum objects", function () {
                var testDatum = {
                    a: 1,
                    b: 13,
                    c: 42,
                    d: -1977
                };

                function lookup(index, key) {
                    return testDatum[key];
                }

                mockSeries.getDomainValue.and.callFake(lookup);
                mockSeries.getRangeValue.and.callFake(lookup);

                testMetadata.domains = [{ key: 'a' }, { key: 'b'}];
                testMetadata.ranges = [{ key: 'c' }, { key: 'd'}];

                mockTelemetry.subscribe.calls.mostRecent().args[0](mockSeries);
                mockTimeout.calls.mostRecent().args[0]();

                expect(subscription.getDatum(mockDomainObject))
                    .toEqual(testDatum);
            });
        });
    }
);
