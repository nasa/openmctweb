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
    ["../../src/controllers/EditObjectController"],
    function (EditObjectController) {

        describe("The Edit Object controller", function () {
            var mockScope,
                mockObject,
                testViews,
                mockEditorCapability,
                mockLocation,
                mockNavigationService,
                removeCheck,
                mockStatusCapability,
                mockCapabilities,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$on", "$watch"]
                );
                mockObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getModel", "getCapability", "hasCapability", "useCapability"]
                );
                mockEditorCapability = jasmine.createSpyObj(
                    "mockEditorCapability",
                    ["isEditContextRoot", "dirty", "finish"]
                );
                mockStatusCapability = jasmine.createSpyObj('statusCapability',
                    ["get"]
                );

                mockCapabilities = {
                    "editor": mockEditorCapability,
                    "status": mockStatusCapability
                };

                mockLocation = jasmine.createSpyObj('$location',
                    ["search"]
                );
                mockLocation.search.and.returnValue({"view": "fixed"});
                mockNavigationService = jasmine.createSpyObj('navigationService',
                    ["checkBeforeNavigation"]
                );

                removeCheck = jasmine.createSpy('removeCheck');
                mockNavigationService.checkBeforeNavigation.and.returnValue(removeCheck);

                mockObject.getId.and.returnValue("test");
                mockObject.getModel.and.returnValue({ name: "Test object" });
                mockObject.getCapability.and.callFake(function (key) {
                    return mockCapabilities[key];
                });

                testViews = [
                    { key: 'abc' },
                    {
                        key: 'def',
                        someKey: 'some value'
                    },
                    { key: 'xyz' }
                ];

                mockObject.useCapability.and.callFake(function (c) {
                    return (c === 'view') && testViews;
                });
                mockLocation.search.and.returnValue({ view: 'def' });

                mockScope.domainObject = mockObject;

                controller = new EditObjectController(
                    mockScope,
                    mockLocation,
                    mockNavigationService
                );
            });

            it("adds a check before navigation", function () {
                expect(mockNavigationService.checkBeforeNavigation)
                    .toHaveBeenCalledWith(jasmine.any(Function));

                var checkFn = mockNavigationService.checkBeforeNavigation.calls.mostRecent().args[0];

                mockEditorCapability.isEditContextRoot.and.returnValue(false);
                mockEditorCapability.dirty.and.returnValue(false);

                expect(checkFn()).toBe("Continuing will cause the loss of any unsaved changes.");

                mockEditorCapability.isEditContextRoot.and.returnValue(true);
                expect(checkFn()).toBe("Continuing will cause the loss of any unsaved changes.");

                mockEditorCapability.dirty.and.returnValue(true);
                expect(checkFn())
                    .toBe("Continuing will cause the loss of any unsaved changes.");

            });

            it("cleans up on destroy", function () {
                expect(mockScope.$on)
                    .toHaveBeenCalledWith("$destroy", jasmine.any(Function));

                mockScope.$on.calls.mostRecent().args[1]();

                expect(mockEditorCapability.finish).toHaveBeenCalled();
                expect(removeCheck).toHaveBeenCalled();
            });

            it("sets the active view from query parameters", function () {
                expect(mockScope.representation.selected)
                    .toEqual(testViews[1]);
            });

        });
    }
);
