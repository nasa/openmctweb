/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/QueuingPersistenceCapabilityDecorator"],
    function (QueuingPersistenceCapabilityDecorator) {
        "use strict";

        describe("A queuing persistence capability decorator", function () {
            var mockQueue,
                mockCapabilityService,
                mockPersistenceConstructor,
                mockPersistence,
                mockDomainObject,
                testModel,
                decorator;

            beforeEach(function () {
                mockQueue = jasmine.createSpyObj('queue', ['put']);
                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    ['getCapabilities']
                );
                testModel = { someKey: "some value" };
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist', 'refresh']
                );
                mockPersistenceConstructor = jasmine.createSpy();
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId']
                );

                mockCapabilityService.getCapabilities.andReturn({
                    persistence: mockPersistenceConstructor
                });
                mockPersistenceConstructor.andReturn(mockPersistence);

                decorator = new QueuingPersistenceCapabilityDecorator(
                    mockQueue,
                    mockCapabilityService
                );
            });

            // Here, we verify that the decorator wraps the calls it is expected
            // to wrap; remaining responsibility belongs to
            // QueuingPersistenceCapability itself, which has its own tests.

            it("delegates to its wrapped service", function () {
                decorator.getCapabilities(testModel);
                expect(mockCapabilityService.getCapabilities)
                    .toHaveBeenCalledWith(testModel);
            });

            it("wraps its persistence capability's constructor", function () {
                decorator.getCapabilities(testModel).persistence(mockDomainObject);
                expect(mockPersistenceConstructor).toHaveBeenCalledWith(mockDomainObject);
            });

        });
    }
);