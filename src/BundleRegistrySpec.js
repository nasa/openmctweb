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

define(['./BundleRegistry'], function (BundleRegistry) {

    describe("BundleRegistry", function () {
        let testPath;
        let bundleRegistry;

        beforeEach(function () {
            testPath = 'some/bundle';
            bundleRegistry = new BundleRegistry();
        });

        it("initially lists no bundles", function () {
            expect(bundleRegistry.list()).toEqual([]);
        });

        it("initially contains no bundles", function () {
            expect(bundleRegistry.contains(testPath))
                .toBe(false);
        });

        it("initially provides no bundles", function () {
            expect(bundleRegistry.get(testPath))
                .toBeUndefined();
        });

        describe("when a bundle has been registered", function () {
            let testBundleDef;

            beforeEach(function () {
                testBundleDef = { someKey: "some value" };
                bundleRegistry.register(testPath, testBundleDef);
                bundleRegistry.enable(testPath);
            });

            it("lists registered bundles", function () {
                expect(bundleRegistry.list()).toEqual([testPath]);
            });

            it("contains registered bundles", function () {
                expect(bundleRegistry.contains(testPath))
                    .toBe(true);
            });

            it("provides registered bundles", function () {
                expect(bundleRegistry.get(testPath))
                    .toBe(testBundleDef);
            });

            describe("and then removed", function () {
                beforeEach(function () {
                    bundleRegistry.remove(testPath);
                });

                it("appears empty again", function () {
                    expect(bundleRegistry.list()).toEqual([]);
                });

                it("does not contain the removed bundle", function () {
                    expect(bundleRegistry.contains(testPath))
                        .toBe(false);
                });
            });
        });
    });

});
