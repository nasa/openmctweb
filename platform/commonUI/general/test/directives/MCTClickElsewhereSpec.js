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
    ["../../src/directives/MCTClickElsewhere"],
    function (MCTClickElsewhere) {

        var JQLITE_METHODS = ["on", "off", "find", "parent"];

        describe("The mct-click-elsewhere directive", function () {
            var mockDocument,
                mockScope,
                mockElement,
                testAttrs,
                mockBody,
                mockPlainEl,
                testRect,
                mctClickElsewhere;

            function testEvent(x, y) {
                return {
                    clientX: x,
                    clientY: y,
                    preventDefault: jasmine.createSpy("preventDefault")
                };
            }

            beforeEach(function () {
                mockDocument =
                    jasmine.createSpyObj("$document", JQLITE_METHODS);
                mockScope =
                    jasmine.createSpyObj("$scope", ["$eval", "$apply", "$on"]);
                mockElement =
                    jasmine.createSpyObj("element", JQLITE_METHODS);
                mockBody =
                    jasmine.createSpyObj("body", JQLITE_METHODS);
                mockPlainEl =
                    jasmine.createSpyObj("htmlElement", ["getBoundingClientRect"]);

                testAttrs = {
                    mctClickElsewhere: "some Angular expression"
                };
                testRect = {
                    left: 20,
                    top: 42,
                    width: 60,
                    height: 75
                };
                mockElement[0] = mockPlainEl;
                mockPlainEl.getBoundingClientRect.and.returnValue(testRect);

                mockDocument.find.and.returnValue(mockBody);

                mctClickElsewhere = new MCTClickElsewhere(mockDocument);
                mctClickElsewhere.link(mockScope, mockElement, testAttrs);
            });

            it("is valid as an attribute", function () {
                expect(mctClickElsewhere.restrict).toEqual("A");
            });

            it("detaches listeners when destroyed", function () {
                expect(mockBody.off).not.toHaveBeenCalled();
                mockScope.$on.calls.all().forEach(function (call) {
                    if (call.args[0] === '$destroy') {
                        call.args[1]();
                    }
                });
                expect(mockBody.off).toHaveBeenCalled();
                expect(mockBody.off.calls.mostRecent().args)
                    .toEqual(mockBody.on.calls.mostRecent().args);
            });

            it("listens for mousedown on the document's body", function () {
                expect(mockBody.on)
                    .toHaveBeenCalledWith('mousedown', jasmine.any(Function));
            });

            describe("when a click occurs outside the element's bounds", function () {
                beforeEach(function () {
                    mockBody.on.calls.mostRecent().args[1](testEvent(
                        testRect.left + testRect.width + 10,
                        testRect.top + testRect.height + 10
                    ));
                });

                it("triggers an evaluation of its related Angular expression", function () {
                    expect(mockScope.$apply).toHaveBeenCalled();
                    mockScope.$apply.calls.mostRecent().args[0]();
                    expect(mockScope.$eval)
                        .toHaveBeenCalledWith(testAttrs.mctClickElsewhere);
                });
            });

            describe("when a click occurs within the element's bounds", function () {
                beforeEach(function () {
                    mockBody.on.calls.mostRecent().args[1](testEvent(
                        testRect.left + testRect.width / 2,
                        testRect.top + testRect.height / 2
                    ));
                });

                it("triggers no evaluation", function () {
                    expect(mockScope.$eval).not.toHaveBeenCalled();
                });
            });

        });
    }
);
