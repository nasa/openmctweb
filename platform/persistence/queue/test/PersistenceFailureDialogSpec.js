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
    ["../src/PersistenceFailureDialog", "../src/PersistenceFailureConstants"],
    function (PersistenceFailureDialog, Constants) {

        describe("The persistence failure dialog", function () {
            var testFailures,
                dialog;

            beforeEach(function () {
                testFailures = [
                    {
                        error: { key: Constants.REVISION_ERROR_KEY },
                        someKey: "abc"
                    },
                    {
                        error: { key: "..." },
                        someKey: "def"
                    },
                    {
                        error: { key: Constants.REVISION_ERROR_KEY },
                        someKey: "ghi"
                    },
                    {
                        error: { key: Constants.REVISION_ERROR_KEY },
                        someKey: "jkl"
                    },
                    {
                        error: { key: "..." },
                        someKey: "mno"
                    }
                ];
                dialog = new PersistenceFailureDialog(testFailures);
            });

            it("categorizes failures", function () {
                expect(dialog.model.revised).toEqual([
                    testFailures[0], testFailures[2], testFailures[3]
                ]);
                expect(dialog.model.unrecoverable).toEqual([
                    testFailures[1], testFailures[4]
                ]);
            });

            it("provides an overwrite option", function () {
                expect(dialog.options[0].key).toEqual(Constants.OVERWRITE_KEY);
            });
        });
    }
);
