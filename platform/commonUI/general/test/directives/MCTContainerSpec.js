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
    ["../../src/directives/MCTContainer"],
    function (MCTContainer) {

        describe("The mct-container directive", function () {
            var testContainers = [
                    {
                        bundle: {
                            path: "a",
                            resources: "b"
                        },
                        template: "<div>foo</div>",
                        key: "abc"
                    },
                    {
                        bundle: {
                            path: "x",
                            resources: "y"
                        },
                        template: "<span>bar</span>",
                        key: "xyz",
                        attributes: ["someAttr", "someOtherAttr"]
                    }
                ],
                mctContainer;

            beforeEach(function () {
                mctContainer = new MCTContainer(testContainers);
            });

            it("is applicable to elements", function () {
                expect(mctContainer.restrict).toEqual("E");
            });

            it("creates a new (non-isolate) scope", function () {
                expect(mctContainer.scope).toBe(true);
            });

            it("chooses a template based on key", function () {
                expect(mctContainer.template(
                    undefined,
                    { key: "abc" }
                )).toEqual(testContainers[0].template);

                expect(mctContainer.template(
                    undefined,
                    { key: "xyz" }
                )).toEqual(testContainers[1].template);
            });

            it("copies attributes needed by the container", function () {
                var scope = {};

                mctContainer.link(
                    scope,
                    undefined,
                    {
                        key: "xyz",
                        someAttr: "some value",
                        someOtherAttr: "some other value",
                        someExtraAttr: "should not be present"
                    }
                );

                expect(scope.container.someAttr).toEqual("some value");
                expect(scope.container.someOtherAttr).toEqual("some other value");
                expect(scope.container.someExtraAttr).toBeUndefined();
            });

        });
    }
);
