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
    ["../src/MCTControl"],
    function (MCTControl) {

        describe("The mct-control directive", function () {
            var testControls,
                mockScope,
                mockLinker,
                mockChangeTemplate,
                mctControl;

            beforeEach(function () {
                testControls = [
                    {
                        key: "abc",
                        bundle: {
                            path: "a",
                            resources: "b"
                        },
                        templateUrl: "c/template.html"
                    },
                    {
                        key: "xyz",
                        bundle: {
                            path: "x",
                            resources: "y"
                        },
                        templateUrl: "z/template.html"
                    }
                ];

                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockLinker = jasmine.createSpyObj("templateLinker", ["link"]);
                mockChangeTemplate = jasmine.createSpy('changeTemplate');
                mockLinker.link.and.returnValue(mockChangeTemplate);

                mctControl = new MCTControl(mockLinker, testControls);
            });

            it("is restricted to the element level", function () {
                expect(mctControl.restrict).toEqual("E");
            });

            it("watches its passed key to choose a template", function () {
                mctControl.link(mockScope);

                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "key",
                    jasmine.any(Function)
                );
            });

            it("changes its template dynamically", function () {
                mctControl.link(mockScope);

                expect(mockChangeTemplate)
                    .not.toHaveBeenCalledWith(testControls[1]);

                mockScope.key = "xyz";
                mockScope.$watch.calls.mostRecent().args[1]("xyz");

                // Should have communicated the template path to
                // ng-include via the "inclusion" field in scope
                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(testControls[1]);
            });

        });
    }
);
