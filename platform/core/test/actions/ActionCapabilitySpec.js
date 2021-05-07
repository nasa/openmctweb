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

/**
 * ActionCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/actions/ActionCapability"],
    function (ActionCapability) {

        describe("The action capability", function () {
            var mockQ,
                mockAction,
                mockActionService,
                mockDomainObject,
                capability;

            beforeEach(function () {
                mockAction = jasmine.createSpyObj(
                    "action",
                    ["perform", "getMetadata"]
                );
                mockActionService = jasmine.createSpyObj(
                    "actionService",
                    ["getActions"]
                );
                mockQ = jasmine.createSpyObj(
                    "$q",
                    ["when"]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getModel", "getCapability", "hasCapability", "useCapability"]
                );

                mockActionService.getActions.and.returnValue([mockAction, {}]);

                capability = new ActionCapability(
                    mockQ,
                    mockActionService,
                    mockDomainObject
                );
            });

            it("retrieves action for domain objects from the action service", function () {
                // Verify precondition
                expect(mockActionService.getActions).not.toHaveBeenCalled();

                // Call getActions
                expect(capability.getActions("some key")).toEqual([mockAction, {}]);

                // Verify interaction
                expect(mockActionService.getActions).toHaveBeenCalledWith({
                    key: "some key",
                    domainObject: mockDomainObject
                });
            });

            it("promises the result of performed actions", function () {
                var mockPromise = jasmine.createSpyObj("promise", ["then"]);
                mockQ.when.and.returnValue(mockPromise);
                mockAction.perform.and.returnValue("the action's result");

                // Verify precondition
                expect(mockAction.perform).not.toHaveBeenCalled();

                // Perform via capability
                expect(capability.perform()).toEqual(mockPromise);

                // Verify that the action's result is what was wrapped
                expect(mockQ.when).toHaveBeenCalledWith("the action's result");

            });

        });
    }
);
