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
    ["../src/TelemetryAggregator"],
    function (TelemetryAggregator) {

        describe("The telemetry aggregator", function () {
            var mockQ,
                mockProviders,
                mockUnsubscribes,
                aggregator;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            function makeMockProvider(key, index) {
                var provider = jasmine.createSpyObj(
                        "provider" + index,
                        ["requestTelemetry", "subscribe"]
                    ),
                    unsubscribe = jasmine.createSpy("unsubscribe" + index);
                provider.requestTelemetry.and.returnValue({ someKey: key });
                provider.subscribe.and.returnValue(unsubscribe);

                // Store to verify interactions later
                mockUnsubscribes[index] = unsubscribe;

                return provider;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["all"]);
                mockQ.all.and.returnValue(mockPromise([]));

                mockUnsubscribes = [];
                mockProviders = ["a", "b", "c"].map(makeMockProvider);

                aggregator = new TelemetryAggregator(mockQ, mockProviders);
            });

            it("passes requests to aggregated providers", function () {
                var requests = [
                    { someKey: "some value" },
                    { someKey: "some other value" }
                ];

                aggregator.requestTelemetry(requests);

                mockProviders.forEach(function (mockProvider) {
                    expect(mockProvider.requestTelemetry)
                        .toHaveBeenCalledWith(requests);
                });
            });

            it("merges results from all providers", function () {
                var capture = jasmine.createSpy("capture");

                mockQ.all.and.returnValue(mockPromise([
                    { someKey: "some value" },
                    { someOtherKey: "some other value" }
                ]));

                aggregator.requestTelemetry().then(capture);

                // Verify that aggregator results were run through
                // $q.all
                expect(mockQ.all).toHaveBeenCalledWith([
                    { someKey: 'a' },
                    { someKey: 'b' },
                    { someKey: 'c' }
                ]);

                expect(capture).toHaveBeenCalledWith({
                    someKey: "some value",
                    someOtherKey: "some other value"
                });
            });

            it("broadcasts subscriptions from all providers", function () {
                var mockCallback = jasmine.createSpy("callback"),
                    subscription = aggregator.subscribe(mockCallback);

                // Make sure all providers got subscribed to
                mockProviders.forEach(function (mockProvider) {
                    expect(mockProvider.subscribe).toHaveBeenCalled();
                });

                // Verify that unsubscription gets broadcast too
                mockUnsubscribes.forEach(function (mockUnsubscribe) {
                    expect(mockUnsubscribe).not.toHaveBeenCalled();
                });
                subscription(); // unsubscribe
                mockUnsubscribes.forEach(function (mockUnsubscribe) {
                    expect(mockUnsubscribe).toHaveBeenCalled();
                });
            });

        });
    }
);
