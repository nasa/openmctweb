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
 * ImplementationLoaderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/resolve/ImplementationLoader"],
    function (ImplementationLoader) {

        describe("The implementation loader", function () {
            var required,
                loader;

            function mockRequire(names, fulfill, reject) {
                required = {
                    names: names,
                    fulfill: fulfill,
                    reject: reject
                };
            }

            beforeEach(function () {
                required = undefined;
                loader = new ImplementationLoader(mockRequire);
            });

            it("passes script names to require", function () {
                loader.load("xyz.js");
                expect(required.names).toEqual(["xyz.js"]);
            });

            it("wraps require results in a Promise that can resolve", function () {
                // Load and get the result
                var promise = loader.load("xyz.js").then(function (result) {
                    expect(result).toEqual("test result");
                });

                required.fulfill("test result");

                return promise;
            });

            it("wraps require results in a Promise that can reject", function () {
                var result,
                    rejection;

                // Load and get the result
                var promise = loader.load("xyz.js").then(
                    function (v) {
                        result = v;
                    },
                    function (v) {
                        rejection = v;
                    });

                expect(result).toBeUndefined();

                required.reject("test result");

                return promise.then(function () {
                    expect(result).toBeUndefined();
                    expect(rejection).toEqual("test result");
                });
            });

        });
    }
);
