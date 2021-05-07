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
    ["../src/OverlayService"],
    function (OverlayService) {

        describe("The overlay service", function () {
            var mockDocument,
                mockCompile,
                mockRootScope,
                mockBody,
                mockTemplate,
                mockElement,
                mockScope,
                mockTimeout,
                overlayService;

            beforeEach(function () {
                mockDocument = jasmine.createSpyObj("$document", ["find"]);
                mockCompile = jasmine.createSpy("$compile");
                mockRootScope = jasmine.createSpyObj("$rootScope", ["$new"]);
                mockBody = jasmine.createSpyObj("body", ["append"]);
                mockTemplate = jasmine.createSpy("template");
                mockElement = jasmine.createSpyObj("element", ["remove"]);
                mockScope = jasmine.createSpyObj("scope", ["$destroy"]);
                mockTimeout = function (callback) {
                    callback();
                };

                mockDocument.find.and.returnValue(mockBody);
                mockCompile.and.returnValue(mockTemplate);
                mockRootScope.$new.and.returnValue(mockScope);
                mockTemplate.and.returnValue(mockElement);

                overlayService = new OverlayService(
                    mockDocument,
                    mockCompile,
                    mockRootScope,
                    mockTimeout
                );
            });

            it("prepends an mct-include to create overlays", function () {
                overlayService.createOverlay("test", {});
                expect(mockCompile).toHaveBeenCalled();
                expect(mockCompile.calls.mostRecent().args[0].indexOf("mct-include"))
                    .not.toEqual(-1);
            });

            it("adds the templated element to the body", function () {
                overlayService.createOverlay("test", {});
                expect(mockBody.append).toHaveBeenCalledWith(mockElement);
            });

            it("places the provided model/key in its template's scope", function () {
                overlayService.createOverlay("test", { someKey: 42 });
                expect(mockScope.overlay).toEqual({ someKey: 42 });
                expect(mockScope.key).toEqual("test");

                // Make sure this is actually what was rendered, too
                expect(mockTemplate).toHaveBeenCalledWith(mockScope);
            });

            it("removes the prepended element on request", function () {
                var overlay = overlayService.createOverlay("test", {});

                // Verify precondition
                expect(mockElement.remove).not.toHaveBeenCalled();
                expect(mockScope.$destroy).not.toHaveBeenCalled();

                // Dismiss the overlay
                overlay.dismiss();

                // Now it should have been removed, and the scope destroyed
                expect(mockElement.remove).toHaveBeenCalled();
                expect(mockScope.$destroy).toHaveBeenCalled();
            });

        });
    }
);
