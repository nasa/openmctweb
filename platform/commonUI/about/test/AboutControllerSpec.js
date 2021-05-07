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
    ['../src/AboutController'],
    function (AboutController) {

        describe("The About controller", function () {
            let testVersions;
            let mockWindow;
            let controller;

            beforeEach(function () {
                testVersions = [
                    {
                        name: "Some name",
                        value: "1.2.3"
                    },
                    {
                        name: "Some other name",
                        value: "3.2.1"
                    }
                ];
                mockWindow = jasmine.createSpyObj("$window", ["open"]);
                controller = new AboutController(testVersions, mockWindow);
            });

            it("exposes version information", function () {
                // This will be injected, so it should just give back
                // what it got in.
                expect(controller.versions()).toEqual(testVersions);
            });

            it("opens license information in a window", function () {
                //Verify precondition
                expect(mockWindow.open).not.toHaveBeenCalled();
                controller.openLicenses();
                expect(mockWindow.open).toHaveBeenCalledWith("#/licenses");
            });
        });

    }
);
