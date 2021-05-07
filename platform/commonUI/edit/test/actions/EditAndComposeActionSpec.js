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
    ["../../src/actions/EditAndComposeAction"],
    function (EditAndComposeAction) {

        describe("The Link action", function () {
            var mockDomainObject,
                mockParent,
                mockContext,
                mockComposition,
                mockActionCapability,
                mockEditAction,
                mockType,
                actionContext,
                model,
                capabilities,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability"]
                );
                mockParent = {
                    getModel: function () {
                        return model;
                    },
                    getCapability: function (k) {
                        return capabilities[k];
                    },
                    useCapability: function (k, v) {
                        return capabilities[k].invoke(v);
                    }
                };
                mockContext = jasmine.createSpyObj("context", ["getParent"]);
                mockComposition = jasmine.createSpyObj("composition", ["invoke", "add"]);
                mockType = jasmine.createSpyObj("type", ["hasFeature", "getKey"]);
                mockActionCapability = jasmine.createSpyObj("actionCapability", ["getActions"]);
                mockEditAction = jasmine.createSpyObj("editAction", ["perform"]);

                mockDomainObject.getId.and.returnValue("test");
                mockDomainObject.getCapability.and.returnValue(mockContext);
                mockContext.getParent.and.returnValue(mockParent);
                mockType.hasFeature.and.returnValue(true);
                mockType.getKey.and.returnValue("layout");
                mockComposition.invoke.and.returnValue(mockPromise(true));
                mockComposition.add.and.returnValue(mockPromise(true));
                mockActionCapability.getActions.and.returnValue([]);

                capabilities = {
                    composition: mockComposition,
                    action: mockActionCapability,
                    type: mockType
                };
                model = {
                    composition: ["a", "b", "c"]
                };

                actionContext = {
                    domainObject: mockParent,
                    selectedObject: mockDomainObject
                };

                action = new EditAndComposeAction(actionContext);
            });

            it("adds to the parent's composition when performed", function () {
                action.perform();
                expect(mockComposition.add)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("enables edit mode for objects that have an edit action", function () {
                mockActionCapability.getActions.and.returnValue([mockEditAction]);
                action.perform();
                expect(mockEditAction.perform).toHaveBeenCalled();
            });

            it("Does not enable edit mode for objects that do not have an"
                + " edit action", function () {
                mockActionCapability.getActions.and.returnValue([]);
                action.perform();
                expect(mockEditAction.perform).not.toHaveBeenCalled();
                expect(mockComposition.add)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

        });
    }
);
