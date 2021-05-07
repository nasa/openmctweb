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
    ["../../src/windowing/NewTabAction"],
    function (NewTabAction) {

        describe("The new tab action", function () {
            var actionSelected,
                actionCurrent,
                mockWindow,
                mockContextCurrent,
                mockContextSelected,
                mockUrlService;

            beforeEach(function () {
                mockWindow = jasmine.createSpyObj("$window", ["open", "location"]);

                // Context if the current object is selected
                // For example, when the top right new tab
                // button is clicked, the user is using the
                // current domainObject
                mockContextCurrent = jasmine.createSpyObj("context", ["domainObject"]);

                // Context if the selected object is selected
                // For example, when an object in the left
                // tree is opened in a new tab using the
                // context menu
                mockContextSelected = jasmine.createSpyObj("context", ["selectedObject",
                    "domainObject"]);

                // Mocks the urlService used to make the new tab's url from a
                // domainObject and mode
                mockUrlService = jasmine.createSpyObj("urlService", ["urlForNewTab"]);

                // Action done using the current context or mockContextCurrent
                actionCurrent = new NewTabAction(mockUrlService, mockWindow,
                    mockContextCurrent);

                // Action done using the selected context or mockContextSelected
                actionSelected = new NewTabAction(mockUrlService, mockWindow,
                    mockContextSelected);

            });

            it("new tab with current url is opened", function () {
                actionCurrent.perform();
            });

            it("new tab with a selected url is opened", function () {
                actionSelected.perform();
            });

        });
    }
);
