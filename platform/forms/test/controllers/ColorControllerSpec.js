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
    ["../../src/controllers/ColorController"],
    function (ColorController) {

        var COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

        describe("The color picker's controller", function () {
            var controller;

            beforeEach(function () {
                controller = new ColorController();
            });

            it("exposes groups of colors", function () {
                var groups = controller.groups();

                // Make sure that the groups array is non-empty
                expect(Array.isArray(groups)).toBeTruthy();
                expect(groups.length).not.toEqual(0);

                groups.forEach(function (group) {
                    // Make sure each group is a non-empty array
                    expect(Array.isArray(group)).toBeTruthy();
                    expect(group.length).not.toEqual(0);
                    // Make sure they're valid web colors
                    group.forEach(function (color) {
                        expect(COLOR_REGEX.test(color)).toBeTruthy();
                    });
                });
            });

            it("exposes unique colors", function () {
                var count = 0, set = {};

                // Count each color, and add them to the set
                controller.groups().forEach(function (group) {
                    group.forEach(function (color) {
                        count += 1;
                        set[color] = true;
                    });
                });

                // Size of set should be number of colors if all were unique
                expect(Object.keys(set).length).toEqual(count);
            });
        });
    }
);
