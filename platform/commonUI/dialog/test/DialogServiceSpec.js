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
 * MCTIncudeSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/DialogService"],
    function (DialogService) {

        describe("The dialog service", function () {
            var mockOverlayService,
                mockQ,
                mockLog,
                mockOverlay,
                mockDeferred,
                mockDocument,
                mockBody,
                dialogService;

            beforeEach(function () {
                mockOverlayService = jasmine.createSpyObj(
                    "overlayService",
                    ["createOverlay"]
                );
                mockQ = jasmine.createSpyObj(
                    "$q",
                    ["defer"]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["warn", "info", "debug"]
                );
                mockOverlay = jasmine.createSpyObj(
                    "overlay",
                    ["dismiss"]
                );
                mockDeferred = jasmine.createSpyObj(
                    "deferred",
                    ["resolve", "reject"]
                );
                mockDocument = jasmine.createSpyObj(
                    "$document",
                    ["find"]
                );
                mockBody = jasmine.createSpyObj('body', ['on', 'off']);
                mockDocument.find.and.returnValue(mockBody);

                mockDeferred.promise = "mock promise";

                mockQ.defer.and.returnValue(mockDeferred);
                mockOverlayService.createOverlay.and.returnValue(mockOverlay);

                dialogService = new DialogService(
                    mockOverlayService,
                    mockQ,
                    mockLog,
                    mockDocument
                );
            });

            it("adds an overlay when user input is requested", function () {
                dialogService.getUserInput({}, {});
                expect(mockOverlayService.createOverlay).toHaveBeenCalled();
            });

            it("allows user input to be canceled", function () {
                dialogService.getUserInput({}, { someKey: "some value" });
                mockOverlayService.createOverlay.calls.mostRecent().args[1].cancel();
                expect(mockDeferred.reject).toHaveBeenCalled();
                expect(mockDeferred.resolve).not.toHaveBeenCalled();
            });

            it("passes back the result of user input when confirmed", function () {
                var value = { someKey: 42 };
                dialogService.getUserInput({}, value);
                mockOverlayService.createOverlay.calls.mostRecent().args[1].confirm();
                expect(mockDeferred.reject).not.toHaveBeenCalled();
                expect(mockDeferred.resolve).toHaveBeenCalledWith(value);
            });

            it("logs a warning when a dialog is already showing", function () {
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).not.toHaveBeenCalled();
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).toHaveBeenCalled();
                expect(mockDeferred.reject).toHaveBeenCalled();
            });

            it("can show multiple dialogs if prior ones are dismissed", function () {
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).not.toHaveBeenCalled();
                mockOverlayService.createOverlay.calls.mostRecent().args[1].confirm();
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).not.toHaveBeenCalled();
                expect(mockDeferred.reject).not.toHaveBeenCalled();
            });

            it("provides an options dialogs", function () {
                var dialogModel = {};
                dialogService.getUserChoice(dialogModel);
                expect(mockOverlayService.createOverlay).toHaveBeenCalledWith(
                    'overlay-options',
                    {
                        dialog: dialogModel,
                        confirm: jasmine.any(Function),
                        cancel: jasmine.any(Function)
                    },
                    't-dialog'
                );
            });

            it("invokes the overlay service with the correct parameters when"
                + " a blocking dialog is requested", function () {
                var dialogModel = {};
                expect(dialogService.showBlockingMessage(dialogModel)).not.toBe(false);
                expect(mockOverlayService.createOverlay).toHaveBeenCalledWith(
                    "overlay-blocking-message",
                    dialogModel,
                    "t-dialog-sm"
                );
            });

            it("adds a keydown event listener to the body", function () {
                dialogService.getUserInput({}, {});
                expect(mockDocument.find).toHaveBeenCalledWith("body");
                expect(mockBody.on).toHaveBeenCalledWith("keydown", jasmine.any(Function));
            });

            it("destroys the event listener when the dialog is cancelled", function () {
                dialogService.getUserInput({}, {});
                mockOverlayService.createOverlay.calls.mostRecent().args[1].cancel();
                expect(mockBody.off).toHaveBeenCalledWith("keydown", jasmine.any(Function));
            });

            it("cancels the dialog when an escape keydown event is triggered", function () {
                dialogService.getUserInput({}, {});
                mockBody.on.calls.mostRecent().args[1]({
                    keyCode: 27
                });
                expect(mockDeferred.reject).toHaveBeenCalled();
                expect(mockDeferred.resolve).not.toHaveBeenCalled();
            });

            it("ignores non escape keydown events", function () {
                dialogService.getUserInput({}, {});
                mockBody.on.calls.mostRecent().args[1]({
                    keyCode: 13
                });
                expect(mockDeferred.reject).not.toHaveBeenCalled();
                expect(mockDeferred.resolve).not.toHaveBeenCalled();
            });

            describe("the blocking message dialog", function () {
                var dialogModel = {};
                var dialogHandle;

                beforeEach(function () {
                    dialogHandle = dialogService.showBlockingMessage(dialogModel);
                });

                it("returns a handle to the dialog", function () {
                    expect(dialogHandle).not.toBe(undefined);
                });

                it("dismissing the dialog dismisses the overlay", function () {
                    dialogHandle.dismiss();
                    expect(mockOverlay.dismiss).toHaveBeenCalled();
                });

                it("individual dialogs can be dismissed", function () {
                    var secondDialogHandle,
                        secondMockOverlay;

                    dialogHandle.dismiss();

                    secondMockOverlay = jasmine.createSpyObj(
                        "overlay",
                        ["dismiss"]
                    );
                    mockOverlayService.createOverlay.and.returnValue(secondMockOverlay);
                    secondDialogHandle = dialogService.showBlockingMessage(dialogModel);

                    //Dismiss the first dialog. It should only dismiss if it
                    // is active
                    dialogHandle.dismiss();
                    expect(secondMockOverlay.dismiss).not.toHaveBeenCalled();
                    secondDialogHandle.dismiss();
                    expect(secondMockOverlay.dismiss).toHaveBeenCalled();
                });
            });

        });
    }
);
