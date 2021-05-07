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
    ["../src/TelemetryController"],
    function (TelemetryController) {

        describe("The telemetry controller", function () {
            var mockScope,
                mockQ,
                mockTimeout,
                mockLog,
                mockDomainObject,
                mockTelemetry,
                mockUnsubscribe,
                controller;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$on", "$broadcast", "$watch"]
                );
                mockQ = jasmine.createSpyObj("$q", ["all", "when"]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockLog = jasmine.createSpyObj("$log", ["warn", "info", "debug"]);

                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getCapability",
                        "getModel",
                        "hasCapability",
                        "useCapability"
                    ]
                );

                mockTelemetry = jasmine.createSpyObj(
                    "telemetry",
                    ["requestData", "subscribe", "getMetadata"]
                );
                mockUnsubscribe = jasmine.createSpy("unsubscribe");

                mockQ.when.and.callFake(mockPromise);
                mockQ.all.and.returnValue(mockPromise([mockDomainObject]));

                mockDomainObject.getId.and.returnValue("testId");
                mockDomainObject.getModel.and.returnValue({ name: "TEST" });
                mockDomainObject.useCapability.and.returnValue([]);
                mockDomainObject.hasCapability.and.returnValue(true);
                mockDomainObject.getCapability.and.returnValue(mockTelemetry);

                mockTelemetry.getMetadata.and.returnValue({
                    source: "testSource",
                    key: "testKey"
                });
                mockTelemetry.requestData.and.returnValue(mockPromise({
                    telemetryKey: "some value"
                }));
                mockTelemetry.subscribe.and.returnValue(mockUnsubscribe);

                controller = new TelemetryController(
                    mockScope,
                    mockQ,
                    mockTimeout,
                    mockLog
                );
            });

            it("watches the domain object in scope", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });

            it("starts a refresh interval", function () {
                expect(mockTimeout).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Number)
                );
            });

            it("changes refresh interval on request", function () {
                controller.setRefreshInterval(42);

                // Tick the clock; should issue a new request, with
                // the new interval
                mockTimeout.calls.mostRecent().args[0]();

                expect(mockTimeout).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    42
                );
            });

            it("requests data from domain objects", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                expect(mockTelemetry.requestData).toHaveBeenCalled();
            });

            it("logs a warning if no telemetry capability exists", function () {
                mockDomainObject.getCapability.and.returnValue(undefined);

                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("provides telemetry metadata", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                expect(controller.getMetadata()).toEqual([
                    {
                        source: "testSource",
                        key: "testKey"
                    }
                ]);
            });

            it("provides telemetry-possessing domain objects", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                expect(controller.getTelemetryObjects())
                    .toEqual([mockDomainObject]);
            });

            it("provides telemetry data", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                expect(controller.getResponse())
                    .toEqual([{telemetryKey: "some value"}]);
            });

            it("provides telemetry data per-id", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                expect(controller.getResponse("testId"))
                    .toEqual({telemetryKey: "some value"});
            });

            it("provides a check for pending requests", function () {
                expect(controller.isRequestPending()).toBeFalsy();
            });

            it("allows a request to be specified", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                controller.requestData({ someKey: "some request" });

                expect(mockTelemetry.requestData).toHaveBeenCalledWith({
                    someKey: "some request"
                });
            });

            it("allows an object to be removed from scope", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](undefined);

                expect(controller.getTelemetryObjects())
                    .toEqual([]);
            });

            it("broadcasts when telemetry is available", function () {
                // Push into the scope...
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                controller.requestData({ someKey: "some request" });

                // Verify precondition
                expect(mockScope.$broadcast).not.toHaveBeenCalled();

                // Call the broadcast timeout
                mockTimeout.calls.mostRecent().args[0]();

                // Should have broadcast a telemetryUpdate
                expect(mockScope.$broadcast)
                    .toHaveBeenCalledWith("telemetryUpdate");
            });

            it("subscribes for streaming telemetry updates", function () {
                // Push into scope to create subscriptions
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                // Should have subscribed
                expect(mockTelemetry.subscribe)
                    .toHaveBeenCalledWith(jasmine.any(Function));
                // Invoke the subscriber function (for coverage)
                mockTelemetry.subscribe.calls.mostRecent().args[0]({});
            });

            it("listens for scope destruction to clean up", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );
                mockScope.$on.calls.mostRecent().args[1]();
            });

            it("unsubscribes when destroyed", function () {
                // Push into scope to create subscriptions
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                // Invoke "$destroy" listener
                mockScope.$on.calls.mostRecent().args[1]();

                // Should have unsubscribed
                expect(mockUnsubscribe).toHaveBeenCalled();
            });
        });
    }
);
