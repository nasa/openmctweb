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
 * ExtensionSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/load/Extension", "../../src/load/Bundle"],
    function (Extension, Bundle) {

        describe("An extension", function () {
            var bundle;

            beforeEach(function () {
                bundle = new Bundle("test/bundle", {});
            });

            it("reports its key", function () {
                expect(new Extension(bundle, "tests", { key: "testKey"}).getKey())
                    .toEqual("testKey");
            });

            it("reports some key, even if non is defined", function () {
                expect(new Extension(bundle, "tests", {}).getKey()).toBeDefined();
            });

            it("allows retrieval of its declaring bundle", function () {
                expect(new Extension(bundle, "tests", {}).getBundle()).toBe(bundle);
            });

            it("reports its category", function () {
                expect(new Extension(bundle, "tests", {}).getCategory())
                    .toEqual("tests");
                expect(new Extension(bundle, "otherThings", {}).getCategory())
                    .toEqual("otherThings");
            });

            it("provides a check to see if an implementation is associated with the extension", function () {
                expect(new Extension(bundle, "tests", {}).hasImplementation())
                    .toBeFalsy();
                expect(new Extension(bundle, "tests", { implementation: "Something.js" }).hasImplementation())
                    .toBeTruthy();
            });

            it("provides a full path to an implementation, if present", function () {
                expect(new Extension(bundle, "tests", { implementation: "Something.js" }).getImplementationPath())
                    .toEqual("test/bundle/src/Something.js");
            });

            it("does not define an implementation path if there is no implementation", function () {
                expect(new Extension(bundle, "tests", {}).getImplementationPath())
                    .toBeUndefined();
            });

            it("provides a log-friendly name which contains the extension key", function () {
                var logName =
                        new Extension(bundle, "tests", { key: "testKey"}).getLogName();
                expect(logName.indexOf("testKey")).not.toEqual(-1);
            });

            it("allows its definition to be retrieved", function () {
                var definition = {
                        key: "someKey",
                        implementation: "SomeImplementation.js"
                    },
                    reported = new Extension(bundle, "tests", definition).getDefinition();

                // Bundle is added, so we can't do a normal toEqual; check that
                // all keys are still there, though.
                Object.keys(definition).forEach(function (k) {
                    expect(reported[k]).toEqual(definition[k]);
                });
            });

            it("includes the bundle in its definition", function () {
                // Bundle is needed by some registrars in the the registration phase,
                // so make sure it gets attached to the definition.
                var definition = {
                        key: "someKey",
                        implementation: "SomeImplementation.js"
                    },
                    reported = new Extension(bundle, "tests", definition).getDefinition();

                expect(reported.bundle).toEqual(bundle.getDefinition());
            });
        });
    }
);
