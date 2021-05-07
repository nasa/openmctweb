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
    ["../src/TelemetrySubscriber"],
    function (TelemetrySubscriber) {

        describe("The telemetry subscriber", function () {
            // TelemetrySubscriber just provides a factory
            // for TelemetrySubscription, so most real testing
            // should happen there.
            var mockQ,
                mockTimeout,
                mockDomainObject,
                mockCallback,
                mockPromise,
                subscriber;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["when"]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "useCapability", "hasCapability"]
                );
                mockCallback = jasmine.createSpy("callback");
                mockPromise = jasmine.createSpyObj("promise", ["then"]);

                mockQ.when.and.returnValue(mockPromise);
                mockPromise.then.and.returnValue(mockPromise);

                subscriber = new TelemetrySubscriber(mockQ, mockTimeout);
            });

            it("acts as a factory for subscription objects", function () {
                var subscription = subscriber.subscribe(
                    mockDomainObject,
                    mockCallback
                );
                // Just verify that this looks like a TelemetrySubscription
                [
                    "unsubscribe",
                    "getTelemetryObjects",
                    "getRangeValue",
                    "getDomainValue"
                ].forEach(function (method) {
                    expect(subscription[method])
                        .toEqual(jasmine.any(Function));
                });
            });

        });
    }
);
