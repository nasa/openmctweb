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
 * ExtensionResolverSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/resolve/ExtensionResolver", "../../src/load/Bundle"],
    function (ExtensionResolver, Bundle) {

        describe("", function () {
            var mockLoader,
                mockLog,
                resolver;

            // Test implementation, to load from the mock loader
            function Constructor() {
                return { someKey: "some value" };
            }

            Constructor.someProperty = "some static value";

            beforeEach(function () {
                mockLoader = jasmine.createSpyObj("loader", ["load"]);

                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );

                mockLoader.load.and.returnValue(Promise.resolve(Constructor));

                resolver = new ExtensionResolver(mockLoader, mockLog);
            });

            it("requests implementations from the implementation loader", function () {
                var bundle = new Bundle("w", {
                        sources: "x",
                        extensions: { tests: [{ implementation: "y/z.js" }] }
                    }),
                    extension = bundle.getExtensions("tests")[0];

                return resolver.resolve(extension).then(function (result) {
                    // Verify that the right file was requested
                    expect(mockLoader.load).toHaveBeenCalledWith("w/x/y/z.js");

                    // We should have resolved to the constructor from above
                    expect(typeof result).toEqual('function');
                    expect(result().someKey).toEqual("some value");
                });
            });

            it("issues a warning and defaults to plain definition if load fails", function () {
                var bundle = new Bundle("w", {
                        sources: "x",
                        extensions: {
                            tests: [{
                                someOtherKey: "some other value",
                                implementation: "y/z.js"
                            }]
                        }
                    }),
                    extension = bundle.getExtensions("tests")[0];

                mockLoader.load.and.returnValue(Promise.reject(new Error("test error")));

                return resolver.resolve(extension).then(function (result) {
                    // Should have gotten a warning
                    expect(mockLog.warn).toHaveBeenCalled();
                    // We should have resolved to the plain definition from above
                    expect(typeof result).not.toEqual('function');
                    expect(result.someOtherKey).toEqual("some other value");
                });
            });

            it("ensures implementation properties are exposed", function () {
                var bundle = new Bundle("w", {
                        sources: "x",
                        extensions: { tests: [{ implementation: "y/z.js" }] }
                    }),
                    extension = bundle.getExtensions("tests")[0];

                return resolver.resolve(extension).then(function (result) {
                    // Verify that the right file was requested
                    expect(mockLoader.load).toHaveBeenCalledWith("w/x/y/z.js");
                    // We should have resolved to the constructor from above
                    expect(typeof result).toEqual('function');
                    expect(result().someKey).toEqual("some value");
                    expect(result.someProperty).toEqual("some static value");
                });
            });

        });
    }
);
