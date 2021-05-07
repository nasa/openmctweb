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
    ["../src/PersistenceFailureController"],
    function (PersistenceFailureController) {

        describe("The persistence failure controller", function () {
            var controller;

            beforeEach(function () {
                controller = new PersistenceFailureController();
            });

            it("converts timestamps to human-readable dates", function () {
                expect(controller.formatTimestamp(402514331000))
                    .toEqual("1982-10-03 17:32:11Z");
            });

            it("provides default user names", function () {
                expect(controller.formatUsername(undefined))
                    .toEqual(jasmine.any(String));
            });
        });
    }
);
