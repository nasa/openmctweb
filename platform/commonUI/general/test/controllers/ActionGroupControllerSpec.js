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
    ["../../src/controllers/ActionGroupController"],
    function (ActionGroupController) {

        describe("The action group controller", function () {
            var mockScope,
                mockActions,
                controller;

            function mockAction(metadata, index) {
                var action = jasmine.createSpyObj(
                    "action" + index,
                    ["perform", "getMetadata"]
                );
                action.getMetadata.and.returnValue(metadata);

                return action;
            }

            beforeEach(function () {
                mockActions = jasmine.createSpyObj("action", ["getActions"]);
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                controller = new ActionGroupController(mockScope);
            });

            it("watches scope that may change applicable actions", function () {
                // The action capability
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "action",
                    jasmine.any(Function)
                );
                // The category of action to load
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "parameters.category",
                    jasmine.any(Function)
                );
            });

            it("populates the scope with grouped and ungrouped actions", function () {
                mockScope.action = mockActions;
                mockScope.parameters = { category: "test" };

                mockActions.getActions.and.returnValue([
                    {
                        group: "a",
                        someKey: 0
                    },
                    {
                        group: "a",
                        someKey: 1
                    },
                    {
                        group: "b",
                        someKey: 2
                    },
                    {
                        group: "a",
                        someKey: 3
                    },
                    {
                        group: "b",
                        someKey: 4
                    },
                    { someKey: 5 },
                    { someKey: 6 },
                    {
                        group: "a",
                        someKey: 7
                    },
                    { someKey: 8 }
                ].map(mockAction));

                // Call the watch
                mockScope.$watch.calls.mostRecent().args[1]();

                // Should have grouped and ungrouped actions in scope now
                expect(mockScope.groups.length).toEqual(2);
                expect(mockScope.groups[0].length).toEqual(4); // a
                expect(mockScope.groups[1].length).toEqual(2); // b
                expect(mockScope.ungrouped.length).toEqual(3); // ungrouped
            });

            it("provides empty arrays when no action capability is available", function () {
                // Call the watch
                mockScope.$watch.calls.mostRecent().args[1]();

                expect(mockScope.groups.length).toEqual(0);
                expect(mockScope.ungrouped.length).toEqual(0);
            });
        });
    }
);
