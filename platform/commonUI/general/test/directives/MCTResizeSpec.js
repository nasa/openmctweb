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
    ["../../src/directives/MCTResize"],
    function (MCTResize) {

        describe("The mct-resize directive", function () {
            var mockTimeout,
                mockScope,
                testElement,
                testAttrs,
                mctResize;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy("$timeout");
                mockScope = jasmine.createSpyObj("$scope", ["$eval", "$on", "$apply"]);

                testElement = {
                    offsetWidth: 100,
                    offsetHeight: 200
                };
                testAttrs = { mctResize: "some-expr" };

                mctResize = new MCTResize(mockTimeout);
            });

            it("is applicable as an attribute only", function () {
                expect(mctResize.restrict).toEqual("A");
            });

            it("starts tracking size changes upon link", function () {
                expect(mockTimeout).not.toHaveBeenCalled();
                mctResize.link(mockScope, [testElement], testAttrs);
                expect(mockTimeout).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Number),
                    false
                );
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctResize,
                    {
                        bounds: {
                            width: 100,
                            height: 200
                        }
                    }
                );
            });

            it("reports size changes on a timeout", function () {
                mctResize.link(mockScope, [testElement], testAttrs);

                // Change the element's apparent size
                testElement.offsetWidth = 300;
                testElement.offsetHeight = 350;

                // Shouldn't know about this yet...
                expect(mockScope.$eval).not.toHaveBeenCalledWith(
                    testAttrs.mctResize,
                    {
                        bounds: {
                            width: 300,
                            height: 350
                        }
                    }
                );

                // Fire the timeout
                mockTimeout.calls.mostRecent().args[0]();

                // Should have triggered an evaluation of mctResize
                // with the new width & height
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctResize,
                    {
                        bounds: {
                            width: 300,
                            height: 350
                        }
                    }
                );
            });

            it("stops size checking for size changes after destroy", function () {
                mctResize.link(mockScope, [testElement], testAttrs);

                // First, make sure there's a $destroy observer
                expect(mockScope.$on)
                    .toHaveBeenCalledWith("$destroy", jasmine.any(Function));

                // Should have scheduled the first timeout
                expect(mockTimeout.calls.count()).toEqual(1);

                // Fire the timeout
                mockTimeout.calls.mostRecent().args[0]();

                // Should have scheduled another timeout
                expect(mockTimeout.calls.count()).toEqual(2);

                // Broadcast a destroy event
                mockScope.$on.calls.mostRecent().args[1]();

                testElement.offsetWidth = 300;
                testElement.offsetHeight = 350;
                mockScope.$eval.calls.reset();

                // Fire the timeout
                mockTimeout.calls.mostRecent().args[0]();

                // Should NOT have scheduled another timeout
                expect(mockTimeout.calls.count()).toEqual(2);
                expect(mockScope.$eval).not.toHaveBeenCalled();
            });

            it("triggers a digest cycle when size changes", function () {
                var applyCount;
                mctResize.link(mockScope, [testElement], testAttrs);
                applyCount = mockScope.$apply.calls.count();

                // Change the element's apparent size
                testElement.offsetWidth = 300;
                testElement.offsetHeight = 350;

                // Fire the timeout
                mockTimeout.calls.mostRecent().args[0]();

                // No more apply calls
                expect(mockScope.$apply.calls.count())
                    .toBeGreaterThan(applyCount);
            });

            it("does not trigger a digest cycle when size does not change", function () {
                var applyCount;
                mctResize.link(mockScope, [testElement], testAttrs);
                applyCount = mockScope.$apply.calls.count();

                // Fire the timeout
                mockTimeout.calls.mostRecent().args[0]();

                // No more apply calls
                expect(mockScope.$apply.calls.count()).toEqual(applyCount);
            });

        });
    }
);
