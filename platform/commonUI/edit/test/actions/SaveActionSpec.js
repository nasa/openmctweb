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
    ["../../src/actions/SaveAction"],
    function (SaveAction) {

        describe("The Save action", function () {
            var mockDomainObject,
                mockEditorCapability,
                actionContext,
                mockDialogService,
                mockNotificationService,
                mockActionCapability,
                capabilities = {},
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    },
                    catch: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getCapability",
                        "hasCapability",
                        "getModel",
                        "getOriginalObject"
                    ]
                );
                mockEditorCapability = jasmine.createSpyObj(
                    "editor",
                    ["save", "isEditContextRoot"]
                );
                mockActionCapability = jasmine.createSpyObj(
                    "actionCapability",
                    ["perform"]
                );
                capabilities.editor = mockEditorCapability;
                capabilities.action = mockActionCapability;

                actionContext = {
                    domainObject: mockDomainObject
                };

                mockDialogService = jasmine.createSpyObj(
                    "dialogService",
                    ["showBlockingMessage"]
                );

                mockNotificationService = jasmine.createSpyObj(
                    "notificationService",
                    ["info", "error"]
                );

                mockDomainObject.hasCapability.and.returnValue(true);
                mockDomainObject.getCapability.and.callFake(function (capability) {
                    return capabilities[capability];
                });
                mockDomainObject.getModel.and.returnValue({persisted: 0});
                mockEditorCapability.save.and.returnValue(mockPromise(true));
                mockEditorCapability.isEditContextRoot.and.returnValue(true);

                action = new SaveAction(mockDialogService, mockNotificationService, actionContext);
            });

            it("only applies to domain object with an editor capability", function () {
                expect(SaveAction.appliesTo(actionContext)).toBe(true);
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith("editor");

                mockDomainObject.hasCapability.and.returnValue(false);
                mockDomainObject.getCapability.and.returnValue(undefined);
                expect(SaveAction.appliesTo(actionContext)).toBe(false);
            });

            it("only applies to domain object that has already been persisted",
                function () {
                    mockDomainObject.getModel.and.returnValue({persisted: undefined});
                    expect(SaveAction.appliesTo(actionContext)).toBe(false);
                });

            it("uses the editor capability to save the object",
                function () {
                    action.perform();
                    expect(mockEditorCapability.save).toHaveBeenCalled();
                });

            describe("in order to keep the user in the loop", function () {
                var mockDialogHandle;

                beforeEach(function () {
                    mockDialogHandle = jasmine.createSpyObj("dialogHandle", ["dismiss"]);
                    mockDialogService.showBlockingMessage.and.returnValue(mockDialogHandle);
                });

                it("shows a dialog while saving", function () {
                    mockEditorCapability.save.and.returnValue(new Promise(function () {
                    }));
                    action.perform();
                    expect(mockDialogService.showBlockingMessage).toHaveBeenCalled();
                    expect(mockDialogHandle.dismiss).not.toHaveBeenCalled();
                });

                it("hides the dialog when saving is complete", function () {
                    action.perform();
                    expect(mockDialogService.showBlockingMessage).toHaveBeenCalled();
                    expect(mockDialogHandle.dismiss).toHaveBeenCalled();
                });

                it("notifies if saving succeeded", function () {
                    var mockCallback = jasmine.createSpy("callback");
                    mockEditorCapability.save.and.returnValue(Promise.resolve());

                    return action.perform().then(mockCallback).then(function () {
                        expect(mockNotificationService.info).toHaveBeenCalled();
                        expect(mockNotificationService.error).not.toHaveBeenCalled();
                    });
                });

                it("notifies if saving failed", function () {
                    var mockCallback = jasmine.createSpy("callback");
                    mockEditorCapability.save.and.returnValue(Promise.reject("some failure reason"));

                    return action.perform().then(mockCallback).then(function () {
                        expect(mockNotificationService.error).toHaveBeenCalled();
                        expect(mockNotificationService.info).not.toHaveBeenCalled();
                    });
                });
            });
        });
    }
);
