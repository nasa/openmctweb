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
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/types/MergeModels"],
    function (mergeModels) {

        describe("Model merger", function () {
            it("merges models", function () {
                expect(mergeModels(
                    {
                        "a": "property a",
                        "b": [1, 2, 3],
                        "c": {
                            x: 42,
                            z: [0]
                        },
                        "d": "should be ignored"
                    },
                    {
                        "b": [4],
                        "c": {
                            y: "property y",
                            z: ["h"]
                        },
                        "d": "property d"
                    }
                )).toEqual({
                    "a": "property a",
                    "b": [1, 2, 3, 4],
                    "c": {
                        x: 42,
                        y: "property y",
                        z: [0, "h"]
                    },
                    "d": "property d"
                });
            });
        });
    }
);
