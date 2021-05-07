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
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/controllers/ViewSwitcherController"],
    function (ViewSwitcherController) {

        describe("The view switcher controller", function () {
            var mockScope,
                mockTimeout,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockTimeout.and.callFake(function (cb) {
                    cb();
                });
                mockScope.ngModel = {};
                controller = new ViewSwitcherController(mockScope, mockTimeout);
            });

            it("watches for changes in applicable views", function () {
                // The view capability is used by associated
                // representations, so "view" in scope should always
                // be the list of applicable views. The view switcher
                // controller should be watching this.
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "view",
                    jasmine.any(Function)
                );
            });

            it("maintains the current selection when views change", function () {
                var views = [
                    {
                        key: "a",
                        name: "View A"
                    },
                    {
                        key: "b",
                        name: "View B"
                    },
                    {
                        key: "c",
                        name: "View C"
                    },
                    {
                        key: "d",
                        name: "View D"
                    }
                ];
                mockScope.$watch.calls.mostRecent().args[1](views);
                mockScope.ngModel.selected = views[1];

                // Change the set of applicable views
                mockScope.$watch.calls.mostRecent().args[1]([
                    {
                        key: "a",
                        name: "View A"
                    },
                    {
                        key: "b",
                        name: "View B"
                    },
                    {
                        key: "x",
                        name: "View X"
                    }
                ]);

                // "b" is still in there, should remain selected
                expect(mockScope.ngModel.selected).toEqual(views[1]);
            });

            it("chooses a default if a selected view becomes inapplicable", function () {
                var views = [
                    {
                        key: "a",
                        name: "View A"
                    },
                    {
                        key: "b",
                        name: "View B"
                    },
                    {
                        key: "c",
                        name: "View C"
                    },
                    {
                        key: "d",
                        name: "View D"
                    }
                ];
                mockScope.$watch.calls.mostRecent().args[1](views);
                mockScope.ngModel.selected = views[1];

                // Change the set of applicable views
                mockScope.$watch.calls.mostRecent().args[1]([
                    {
                        key: "a",
                        name: "View A"
                    },
                    {
                        key: "c",
                        name: "View C"
                    },
                    {
                        key: "x",
                        name: "View X"
                    }
                ]);

                // "b" is still in there, should remain selected
                expect(mockScope.ngModel.selected).not.toEqual(views[1]);
            });

            // Use of a timeout avoids infinite digest problems when deeply
            // nesting switcher-driven views (e.g. in a layout.) See WTD-689
            it("updates initial selection on a timeout", function () {
                // Verify precondition
                expect(mockTimeout).not.toHaveBeenCalled();

                // Invoke the watch for set of views
                mockScope.$watch.calls.mostRecent().args[1]([]);

                // Should have run on a timeout
                expect(mockTimeout).toHaveBeenCalled();
            });

        });
    }
);
