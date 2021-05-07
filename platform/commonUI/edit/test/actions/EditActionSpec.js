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
    ["../../src/actions/EditAction"],
    function (EditAction) {

        describe("The Edit action", function () {
            var mockLocation,
                mockNavigationService,
                mockLog,
                mockDomainObject,
                mockType,
                mockEditor,
                actionContext,
                capabilities,
                action;

            beforeEach(function () {
                mockLocation = jasmine.createSpyObj(
                    "$location",
                    ["path"]
                );
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    ["setNavigation", "getNavigation", "addListener", "removeListener"]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getModel", "getCapability", "hasCapability", "useCapability"]
                );
                mockType = jasmine.createSpyObj(
                    "type",
                    ["hasFeature"]
                );
                mockEditor = jasmine.createSpyObj(
                    "editorCapability",
                    ["edit", "isEditContextRoot"]
                );

                capabilities = {
                    type: mockType,
                    editor: mockEditor
                };

                mockDomainObject.getCapability.and.callFake(function (name) {
                    return capabilities[name];
                });
                mockDomainObject.hasCapability.and.returnValue(true);
                mockType.hasFeature.and.returnValue(true);

                actionContext = { domainObject: mockDomainObject };

                action = new EditAction(
                    mockLocation,
                    mockNavigationService,
                    mockLog,
                    actionContext
                );
            });

            it("is only applicable when an editable domain object is present", function () {
                expect(EditAction.appliesTo(actionContext)).toBeTruthy();
                expect(EditAction.appliesTo({})).toBeFalsy();

                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith('editor');
                // Should have checked for creatability
                expect(mockType.hasFeature).toHaveBeenCalledWith('creation');
            });

            it("is only applicable to objects not already in edit mode", function () {
                mockEditor.isEditContextRoot.and.returnValue(false);
                expect(EditAction.appliesTo(actionContext)).toBe(true);
                mockEditor.isEditContextRoot.and.returnValue(true);
                expect(EditAction.appliesTo(actionContext)).toBe(false);
            });

            it ("invokes the Edit capability on the object", function () {
                action.perform();
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith("editor");
            });

        });
    }
);
