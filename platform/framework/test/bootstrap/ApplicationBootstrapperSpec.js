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
 * ApplicationBootstrapperSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/bootstrap/ApplicationBootstrapper"],
    function (ApplicationBootstrapper) {

        describe("The application bootstrapper", function () {
            // Test support variables
            var bootstrapper,
                captured,
                mockAngular,
                mockDocument,
                mockLog,
                mockApp;

            // Used to capture arguments to mocks
            function capture() {
                var names = Array.prototype.slice.apply(arguments, []);

                return function () {
                    var values = arguments;
                    names.forEach(function (name, index) {
                        captured[name] = values[index];
                    });
                };
            }

            // Set up the mocks before each run
            beforeEach(function () {
                captured = {};

                mockAngular = {
                    element: function (selector) {
                        captured.selector = selector;

                        return { ready: capture("callback") };
                    },
                    bootstrap: capture("element", "appNames")
                };

                mockDocument = "I am just a value.";

                mockLog = { info: capture("info") };

                mockApp = { name: "MockApp" };

                bootstrapper = new ApplicationBootstrapper(
                    mockAngular,
                    mockDocument,
                    mockLog
                );

                bootstrapper.bootstrap(mockApp);
            });

            // The tests.

            it("waits for the provided document element to be ready", function () {
                // Should have provided Angular a selector...
                expect(captured.selector).toBe(mockDocument);
                // ...and called ready on the response.
                expect(captured.callback).toBeDefined();
            });

            it("issues a bootstrap call once ready", function () {
                // Verify precondition; bootstrap not called
                expect(captured.element).toBeUndefined();
                expect(captured.appNames).toBeUndefined();

                // Call the "ready" function
                captured.callback();

                // Verify that bootstrap was called
                expect(captured.element).toBe(mockDocument);
                expect(captured.appNames).toEqual([mockApp.name]);
            });

            it("logs that the bootstrap phase has been reached", function () {
                expect(captured.info).toBeDefined();
                expect(typeof captured.info).toEqual('string');
            });

        });
    }
);
