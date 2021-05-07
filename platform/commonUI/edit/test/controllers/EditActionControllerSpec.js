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
    ["../../src/controllers/EditActionController"],
    function (EditActionController) {

        describe("The Edit Action controller", function () {
            var mockSaveActionMetadata = {
                name: "mocked-save-action",
                cssClass: "mocked-save-action-css"
            };

            function fakeGetActions(actionContext) {
                if (actionContext.category === "save") {
                    var mockedSaveActions = [
                        jasmine.createSpyObj("mockSaveAction", ["getMetadata", "perform"]),
                        jasmine.createSpyObj("mockSaveAction", ["getMetadata", "perform"])
                    ];
                    mockedSaveActions.forEach(function (action) {
                        action.getMetadata.and.returnValue(mockSaveActionMetadata);
                    });

                    return mockedSaveActions;
                } else if (actionContext.category === "conclude-editing") {
                    return ["a", "b", "c"];
                } else {
                    throw "EditActionController uses a context that's not covered by tests.";
                }
            }

            var mockScope,
                mockActions,
                controller;

            beforeEach(function () {
                mockActions = jasmine.createSpyObj("action", ["getActions"]);
                mockActions.getActions.and.callFake(fakeGetActions);
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockScope.action = mockActions;
                controller = new EditActionController(mockScope);
            });

            function makeControllerUpdateActions() {
                mockScope.$watch.calls.mostRecent().args[1]();
            }

            it("watches scope that may change applicable actions", function () {
                // The action capability
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "action",
                    jasmine.any(Function)
                );
            });

            it("populates the scope with 'save' actions", function () {
                makeControllerUpdateActions();
                expect(mockScope.saveActions.length).toEqual(2);
            });

            it("converts 'save' actions to their menu counterparts", function () {
                makeControllerUpdateActions();
                var menuOptions = mockScope.saveActionsAsMenuOptions;

                expect(menuOptions.length).toEqual(2);
                expect(menuOptions[0].key).toEqual(mockScope.saveActions[0]);
                expect(menuOptions[1].key).toEqual(mockScope.saveActions[1]);
                menuOptions.forEach(function (option) {
                    expect(option.name).toEqual(mockSaveActionMetadata.name);
                    expect(option.cssClass).toEqual(mockSaveActionMetadata.cssClass);
                });
            });

            it("uses a click handler to perform the clicked action", function () {
                makeControllerUpdateActions();
                var sampleSaveAction = mockScope.saveActions[0];
                mockScope.saveActionMenuClickHandler(sampleSaveAction);
                expect(sampleSaveAction.perform).toHaveBeenCalled();
            });

            it("populates the scope with other editing actions", function () {
                makeControllerUpdateActions();
                expect(mockScope.otherEditActions).toEqual(["a", "b", "c"]);
            });
        });
    }
);
