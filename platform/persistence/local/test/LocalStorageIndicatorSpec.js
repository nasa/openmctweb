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
    ["../src/LocalStorageIndicator"],
    function (LocalStorageIndicator) {

        xdescribe("The local storage status indicator", function () {
            var indicator;

            beforeEach(function () {
                indicator = new LocalStorageIndicator();
            });

            it("provides text to display in status area", function () {
                // Don't particularly care what is there so long
                // as interface is appropriately implemented.
                expect(indicator.getText()).toEqual(jasmine.any(String));
            });

            it("has a database icon", function () {
                expect(indicator.getCssClass()).toEqual("icon-suitcase s-status-caution");
            });

            it("has a 'caution' class to draw attention", function () {
                expect(indicator.getGlyphClass()).toEqual("caution");
            });

            it("provides a description for a tooltip", function () {
                // Just want some non-empty string here. Providing a
                // message here is important but don't want to test wording.
                var description = indicator.getDescription();
                expect(description).toEqual(jasmine.any(String));
                expect(description.length).not.toEqual(0);
            });

        });
    }
);
