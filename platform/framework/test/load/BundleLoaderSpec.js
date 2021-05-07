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
 * BundleLoaderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/load/BundleLoader"],
    function (BundleLoader) {

        describe("The bundle loader", function () {
            var loader,
                mockHttp,
                mockLog,
                mockRegistry,
                testBundles;

            beforeEach(function () {
                testBundles = {
                    "bundles.json": ["bundle/a", "bundle/b"],
                    "bundle/a/bundle.json": {"someValue": 6},
                    "bundle/b/bundle.json": {"someValue": 7}
                };

                mockHttp = jasmine.createSpyObj("$http", ["get"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                mockRegistry = jasmine.createSpyObj(
                    'legacyRegistry',
                    ['list', 'contains', 'get']
                );
                mockRegistry.list.and.returnValue([]);
                mockRegistry.contains.and.returnValue(false);
                loader = new BundleLoader(mockHttp, mockLog, mockRegistry);
            });

            it("accepts a JSON file name and loads all bundles", function () {
                // Set up; return named bundles
                mockHttp.get.and.returnValue(Promise.resolve({ data: [] }));

                // Call load bundles
                return loader.loadBundles("test-filename.json").then(function (bundles) {
                    // Should have loaded the file via $http
                    expect(mockHttp.get).toHaveBeenCalledWith("test-filename.json");

                    // Should have gotten an empty bundle list
                    expect(bundles).toEqual([]);
                });
            });

            it("accepts a list of bundle paths", function () {
                // Set up; return named bundles
                mockHttp.get.and.callFake(function (name) {
                    return Promise.resolve({data: testBundles[name]});
                });

                // Call load bundles
                return loader.loadBundles(["bundle/a", "bundle/b"]).then(function (bundles) {
                    // Should have gotten back two bundles
                    expect(bundles.length).toEqual(2);

                    // They should have the values we expect; don't care about order,
                    // some map/reduce the summation.
                    expect(bundles.map(function (call) {
                        return call.getDefinition().someValue;
                    }).reduce(function (a, b) {
                        return a + b;
                    }, 0)).toEqual(13);
                });
            });

            it("warns about, then ignores, missing bundle declarations", function () {
                // File-not-found
                mockHttp.get.and.returnValue(Promise.reject(new Error("test error")));

                // Try and load
                return loader.loadBundles(["some/bundle"]).then(function (bundles) {
                    // Should have gotten zero bundles
                    expect(bundles.length).toEqual(0);

                    // They should have the values we expect; don't care about order,
                    // some map/reduce the summation.
                    expect(mockLog.warn).toHaveBeenCalled();
                });
            });

            it("warns about, then ignores, malformed bundle declarations", function () {
                // File-not-found
                mockHttp.get.and.returnValue(Promise.resolve(["I am not a valid bundle."]));

                // Try and load
                return loader.loadBundles(["some/bundle"]).then(function (bundles) {
                    // Should have gotten zero bundle
                    expect(bundles.length).toEqual(0);

                    // They should have the values we expect; don't care about order,
                    // some map/reduce the summation.
                    expect(mockLog.warn).toHaveBeenCalled();
                });
            });

        });
    }
);
