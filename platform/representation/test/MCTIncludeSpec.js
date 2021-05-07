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
    ["../src/MCTInclude"],
    function (MCTInclude) {

        describe("The mct-include directive", function () {
            var testTemplates,
                testUrls,
                mockLinker,
                mockScope,
                mockElement,
                mockChangeTemplate,
                mctInclude;

            function fireWatch(expr, value) {
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                testTemplates = [
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
                testUrls = {};
                testTemplates.forEach(function (t, i) {
                    testUrls[t.key] = "some URL " + String(i);
                });
                mockLinker = jasmine.createSpyObj(
                    'templateLinker',
                    ['link', 'getPath']
                );
                mockScope = jasmine.createSpyObj('$scope', ['$watch', '$on']);
                mockElement = jasmine.createSpyObj('element', ['empty']);
                mockChangeTemplate = jasmine.createSpy('changeTemplate');
                mockLinker.link.and.returnValue(mockChangeTemplate);
                mockLinker.getPath.and.callFake(function (template) {
                    return testUrls[template.key];
                });
                mctInclude = new MCTInclude(testTemplates, mockLinker);
                mctInclude.link(mockScope, mockElement, {});
            });

            it("is restricted to elements", function () {
                expect(mctInclude.restrict).toEqual("E");
            });

            it("exposes templates via the templateLinker", function () {
                expect(mockLinker.link)
                    .toHaveBeenCalledWith(mockScope, mockElement, undefined);
            });

            it("reads a template location from a scope's key variable", function () {
                mockScope.key = 'abc';
                fireWatch('key', mockScope.key);
                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(testTemplates[0]);

                mockScope.key = 'xyz';
                fireWatch('key', mockScope.key);
                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(testTemplates[1]);
            });

        });
    }
);
