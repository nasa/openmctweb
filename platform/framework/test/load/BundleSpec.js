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
 * BundleSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/load/Bundle", "../../src/Constants"],
    function (Bundle, Constants) { // Verify against constants, too

        describe("A bundle", function () {
            var PATH = "some/path",
                KEY = "someKey";

            it("reports its path", function () {
                expect(new Bundle(PATH, {}).getPath()).toEqual(PATH);
            });

            it("reports its source path", function () {
                expect(new Bundle(PATH, { "sources": "test-src" }).getSourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + "test-src"
                );
            });

            it("reports the default source path if none is configured", function () {
                expect(new Bundle(PATH, {}).getSourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + Constants.DEFAULT_BUNDLE.sources
                );
            });

            it("reports its resource path", function () {
                expect(new Bundle(PATH, { "resources": "test-res" }).getResourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + "test-res"
                );
            });

            it("reports the default resource path if none is configured", function () {
                expect(new Bundle(PATH, {}).getResourcePath()).toEqual(
                    PATH + Constants.SEPARATOR + Constants.DEFAULT_BUNDLE.resources
                );
            });

            it("has a log-friendly name for the bundle which includes its key and path", function () {
                // Use indexof to look for the bundle's key
                var logName = new Bundle(PATH, { key: KEY }).getLogName();
                expect(logName.indexOf(KEY)).not.toEqual(-1);
                expect(logName.indexOf(PATH)).not.toEqual(-1);
            });

            it("reports all declared extension categories", function () {
                var bundle = new Bundle(PATH, {
                    extensions: {
                        things: [],
                        tests: [],
                        foos: []
                    }
                });

                expect(bundle.getExtensionCategories().sort()).toEqual(
                    ["foos", "tests", "things"]
                );
            });

            it("reports all extensions that have been declared", function () {
                var bundle = new Bundle(PATH, {
                    extensions: { things: [{}, {}, {}] }
                });
                expect(bundle.getExtensions("things").length).toEqual(3);
            });

            it("reports an empty list for extensions that have not been declared", function () {
                var bundle = new Bundle(PATH, {
                    extensions: { things: [{}, {}, {}] }
                });
                expect(bundle.getExtensions("stuffs").length).toEqual(0);
            });
        });
    }
);
