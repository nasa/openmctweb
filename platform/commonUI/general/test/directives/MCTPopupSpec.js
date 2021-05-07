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
    ["../../src/directives/MCTPopup"],
    function (MCTPopup) {

        var JQLITE_METHODS = [
            "on",
            "off",
            "find",
            "parent",
            "css",
            "addClass",
            "append"
        ];

        describe("The mct-popup directive", function () {
            var mockCompile,
                mockPopupService,
                mockPopup,
                mockScope,
                mockElement,
                testAttrs,
                mockTransclude,
                mockParentEl,
                mockNewElement,
                testRect,
                mctPopup;

            beforeEach(function () {
                mockCompile =
                    jasmine.createSpy("$compile");
                mockPopupService =
                    jasmine.createSpyObj("popupService", ["display"]);
                mockPopup =
                    jasmine.createSpyObj("popup", ["dismiss"]);
                mockScope =
                    jasmine.createSpyObj("$scope", ["$eval", "$apply", "$on"]);
                mockElement =
                    jasmine.createSpyObj("element", JQLITE_METHODS);
                mockTransclude =
                    jasmine.createSpy("transclude");
                mockParentEl =
                    jasmine.createSpyObj("parent", ["getBoundingClientRect"]);
                mockNewElement =
                    jasmine.createSpyObj("newElement", JQLITE_METHODS);

                testAttrs = {
                    mctClickElsewhere: "some Angular expression"
                };
                testRect = {
                    left: 20,
                    top: 42,
                    width: 60,
                    height: 75
                };

                mockCompile.and.callFake(function () {
                    var mockFn = jasmine.createSpy();
                    mockFn.and.returnValue(mockNewElement);

                    return mockFn;
                });
                mockElement.parent.and.returnValue([mockParentEl]);
                mockParentEl.getBoundingClientRect.and.returnValue(testRect);
                mockPopupService.display.and.returnValue(mockPopup);

                mctPopup = new MCTPopup(mockCompile, mockPopupService);

                mctPopup.link(
                    mockScope,
                    mockElement,
                    testAttrs,
                    null,
                    mockTransclude
                );
            });

            it("is valid as an element", function () {
                expect(mctPopup.restrict).toEqual("E");
            });

            describe("creates an element which", function () {
                it("displays as a popup", function () {
                    expect(mockPopupService.display).toHaveBeenCalledWith(
                        mockNewElement,
                        [testRect.left, testRect.top]
                    );
                });

                it("displays transcluded content", function () {
                    var mockClone =
                        jasmine.createSpyObj('clone', JQLITE_METHODS);
                    mockTransclude.calls.mostRecent().args[0](mockClone);
                    expect(mockNewElement.append)
                        .toHaveBeenCalledWith(mockClone);
                });

                it("is removed when its containing scope is destroyed", function () {
                    expect(mockPopup.dismiss).not.toHaveBeenCalled();
                    mockScope.$on.calls.all().forEach(function (call) {
                        if (call.args[0] === '$destroy') {
                            call.args[1]();
                        }
                    });
                    expect(mockPopup.dismiss).toHaveBeenCalled();
                });
            });

        });
    }
);
