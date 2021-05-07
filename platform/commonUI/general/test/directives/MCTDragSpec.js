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
    ["../../src/directives/MCTDrag"],
    function (MCTDrag) {

        var JQLITE_METHODS = ["on", "off", "find"];

        describe("The mct-drag directive in Mobile", function () {
            var mockDocument,
                mockAgentService,
                mockScope,
                mockElement,
                testAttrs,
                mockBody,
                mctDrag;

            function testEvent(x, y) {
                return {
                    pageX: x,
                    pageY: y,
                    preventDefault: jasmine.createSpy("preventDefault")
                };
            }

            beforeEach(function () {
                mockDocument =
                    jasmine.createSpyObj("$document", JQLITE_METHODS);
                mockAgentService =
                    jasmine.createSpyObj("agentService", ["isMobile"]);
                mockScope =
                    jasmine.createSpyObj("$scope", ["$eval", "$apply"]);
                mockElement =
                    jasmine.createSpyObj("element", JQLITE_METHODS);
                mockBody =
                    jasmine.createSpyObj("body", JQLITE_METHODS);

                testAttrs = {
                    mctDragDown: "starting a drag",
                    mctDrag: "continuing a drag",
                    mctDragUp: "ending a drag"
                };

                mockDocument.find.and.returnValue(mockBody);
                mockAgentService.isMobile.and.returnValue(true);

                mctDrag = new MCTDrag(mockDocument, mockAgentService);
                mctDrag.link(mockScope, mockElement, testAttrs);
            });

            it("is valid as an attribute", function () {
                expect(mctDrag.restrict).toEqual("A");
            });

            it("listens for touchstart on its element", function () {
                expect(mockElement.on).toHaveBeenCalledWith(
                    "touchstart",
                    jasmine.any(Function)
                );

                // Verify no interactions with body as well
                expect(mockBody.on).not.toHaveBeenCalled();
            });

            it("invokes mctDragDown when dragging begins", function () {
                var event = testEvent(42, 60);
                mockElement.on.calls.mostRecent().args[1](event);
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDragDown,
                    {
                        delta: [0, 0],
                        $event: event
                    }
                );
            });

            it("listens for touchmove after dragging begins", function () {
                mockElement.on.calls.mostRecent().args[1](testEvent(42, 60));
                expect(mockBody.on).toHaveBeenCalledWith(
                    "touchmove",
                    jasmine.any(Function)
                );
                expect(mockBody.on).toHaveBeenCalledWith(
                    "touchend",
                    jasmine.any(Function)
                );
            });

            it("invokes mctDrag expression during drag", function () {
                var event;

                mockElement.on.calls.mostRecent().args[1](testEvent(42, 60));

                // Find and invoke the touchmove listener
                mockBody.on.calls.all().forEach(function (call) {
                    if (call.args[0] === 'touchmove') {
                        call.args[1](event = testEvent(52, 200));
                    }
                });

                // Should have passed that delta to mct-drag expression
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDrag,
                    {
                        delta: [10, 140],
                        $event: event
                    }
                );
            });

            it("invokes mctDragUp expression after drag", function () {
                var event;

                mockElement.on.calls.mostRecent().args[1](testEvent(42, 60));

                // Find and invoke the touchmove listener
                mockBody.on.calls.all().forEach(function (call) {
                    if (call.args[0] === 'touchmove') {
                        call.args[1](testEvent(52, 200));
                    }
                });
                // Find and invoke the touchmove listener
                mockBody.on.calls.all().forEach(function (call) {
                    if (call.args[0] === 'touchend') {
                        call.args[1](event = testEvent(40, 71));
                    }
                });

                // Should have passed that delta to mct-drag-up expression
                // and that delta should have been relative to the
                // initial position
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDragUp,
                    {
                        delta: [-2, 11],
                        $event: event
                    }
                );

                // Should also have unregistered listeners
                expect(mockBody.off).toHaveBeenCalled();
            });

        });

        describe("The mct-drag directive in Desktop", function () {
            var mockDocument,
                mockAgentService,
                mockScope,
                mockElement,
                testAttrs,
                mockBody,
                mctDrag;

            function testEvent(x, y) {
                return {
                    pageX: x,
                    pageY: y,
                    preventDefault: jasmine.createSpy("preventDefault")
                };
            }

            beforeEach(function () {
                mockDocument =
                    jasmine.createSpyObj("$document", JQLITE_METHODS);
                mockAgentService =
                    jasmine.createSpyObj("agentService", ["isMobile"]);
                mockScope =
                    jasmine.createSpyObj("$scope", ["$eval", "$apply"]);
                mockElement =
                    jasmine.createSpyObj("element", JQLITE_METHODS);
                mockBody =
                    jasmine.createSpyObj("body", JQLITE_METHODS);

                testAttrs = {
                    mctDragDown: "starting a drag",
                    mctDrag: "continuing a drag",
                    mctDragUp: "ending a drag"
                };

                mockDocument.find.and.returnValue(mockBody);
                mockAgentService.isMobile.and.returnValue(false);

                mctDrag = new MCTDrag(mockDocument, mockAgentService);
                mctDrag.link(mockScope, mockElement, testAttrs);
            });

            it("is valid as an attribute", function () {
                expect(mctDrag.restrict).toEqual("A");
            });

            it("listens for mousedown on its element", function () {
                expect(mockElement.on).toHaveBeenCalledWith(
                    "mousedown",
                    jasmine.any(Function)
                );

                // Verify no interactions with body as well
                expect(mockBody.on).not.toHaveBeenCalled();
            });

            it("invokes mctDragDown when dragging begins", function () {
                var event = testEvent(42, 60);
                mockElement.on.calls.mostRecent().args[1](event);
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDragDown,
                    {
                        delta: [0, 0],
                        $event: event
                    }
                );
            });

            it("listens for mousemove after dragging begins", function () {
                mockElement.on.calls.mostRecent().args[1](testEvent(42, 60));
                expect(mockBody.on).toHaveBeenCalledWith(
                    "mousemove",
                    jasmine.any(Function)
                );
                expect(mockBody.on).toHaveBeenCalledWith(
                    "mouseup",
                    jasmine.any(Function)
                );
            });

            it("invokes mctDrag expression during drag", function () {
                var event;

                mockElement.on.calls.mostRecent().args[1](testEvent(42, 60));

                // Find and invoke the mousemove listener
                mockBody.on.calls.all().forEach(function (call) {
                    if (call.args[0] === 'mousemove') {
                        call.args[1](event = testEvent(52, 200));
                    }
                });

                // Should have passed that delta to mct-drag expression
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDrag,
                    {
                        delta: [10, 140],
                        $event: event
                    }
                );
            });

            it("invokes mctDragUp expression after drag", function () {
                var event;

                mockElement.on.calls.mostRecent().args[1](testEvent(42, 60));

                // Find and invoke the mousemove listener
                mockBody.on.calls.all().forEach(function (call) {
                    if (call.args[0] === 'mousemove') {
                        call.args[1](testEvent(52, 200));
                    }
                });
                // Find and invoke the mousemove listener
                mockBody.on.calls.all().forEach(function (call) {
                    if (call.args[0] === 'mouseup') {
                        call.args[1](event = testEvent(40, 71));
                    }
                });

                // Should have passed that delta to mct-drag-up expression
                // and that delta should have been relative to the
                // initial position
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctDragUp,
                    {
                        delta: [-2, 11],
                        $event: event
                    }
                );

                // Should also have unregistered listeners
                expect(mockBody.off).toHaveBeenCalled();
            });

        });
    }
);
