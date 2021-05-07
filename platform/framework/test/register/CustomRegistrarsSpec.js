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
 * CustomRegistrarsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/CustomRegistrars"],
    function (CustomRegistrars) {

        describe("Custom registrars", function () {
            var mockLog,
                mockApp,
                customRegistrars;

            // Set up mock test dependencies
            beforeEach(function () {
                mockApp = jasmine.createSpyObj("app", [
                    "controller",
                    "directive",
                    "service",
                    "constant",
                    "config",
                    "run"
                ]);

                mockLog = jasmine.createSpyObj("$log", [
                    "error",
                    "warn",
                    "info",
                    "debug"
                ]);

                customRegistrars = new CustomRegistrars(mockApp, mockLog);
            });

            it("has custom registrars for Angular built-ins", function () {
                expect(customRegistrars.directives).toBeTruthy();
                expect(customRegistrars.controllers).toBeTruthy();
                expect(customRegistrars.services).toBeTruthy();
                expect(customRegistrars.routes).toBeTruthy();
                expect(customRegistrars.constants).toBeTruthy();
                expect(customRegistrars.runs).toBeTruthy();
            });

            it("invokes built-in functions on the app", function () {
                // Verify preconditions, invoke, expect to have been called
                expect(mockApp.directive.calls.count()).toEqual(0);
                customRegistrars.directives([{ key: "a" }, { key: "b" }, { key: "c" }]);
                expect(mockApp.directive.calls.count()).toEqual(3);

                expect(mockApp.controller.calls.count()).toEqual(0);
                customRegistrars.controllers([{ key: "a" }, { key: "b" }, { key: "c" }]);
                expect(mockApp.controller.calls.count()).toEqual(3);

                expect(mockApp.service.calls.count()).toEqual(0);
                customRegistrars.services([{ key: "a" }, { key: "b" }, { key: "c" }]);
                expect(mockApp.service.calls.count()).toEqual(3);

                expect(mockApp.constant.calls.count()).toEqual(0);
                customRegistrars.constants([{
                    key: "a",
                    value: "b"
                }, {
                    key: "b",
                    value: "c"
                }, {
                    key: "c",
                    value: "d"
                }]);
                expect(mockApp.constant.calls.count()).toEqual(3);

                expect(mockApp.run.calls.count()).toEqual(0);
                customRegistrars.runs([jasmine.createSpy("a"), jasmine.createSpy("a"), jasmine.createSpy("a")]);
                expect(mockApp.run.calls.count()).toEqual(3);

            });

            it("warns when keys are not defined, then skips", function () {
                // Verify preconditions, invoke, expect to have been called
                expect(mockApp.directive.calls.count()).toEqual(0);
                customRegistrars.directives([{ key: "a" }, { }, { key: "c" }]);
                expect(mockApp.directive.calls.count()).toEqual(2);
                expect(mockLog.warn.calls.count()).toEqual(1);

                expect(mockApp.controller.calls.count()).toEqual(0);
                customRegistrars.controllers([{ }, { }, { key: "c" }]);
                expect(mockApp.controller.calls.count()).toEqual(1);
                expect(mockLog.warn.calls.count()).toEqual(3);

                expect(mockApp.service.calls.count()).toEqual(0);
                customRegistrars.services([{ }, { }, { }]);
                expect(mockApp.service.calls.count()).toEqual(0);
                expect(mockLog.warn.calls.count()).toEqual(6);

                expect(mockApp.constant.calls.count()).toEqual(0);
                customRegistrars.constants([{ }, { }, { }]);
                expect(mockApp.constant.calls.count()).toEqual(0);
                expect(mockLog.warn.calls.count()).toEqual(9);

                // Notably, keys are not needed for run calls
            });

            it("does not re-register duplicate keys", function () {
                // Verify preconditions, invoke, expect to have been called
                expect(mockApp.directive.calls.count()).toEqual(0);
                customRegistrars.directives([{ key: "a" }, { key: "a" }]);
                expect(mockApp.directive.calls.count()).toEqual(1);

                expect(mockApp.controller.calls.count()).toEqual(0);
                customRegistrars.controllers([{ key: "c" }, { key: "c" }, { key: "c" }]);
                expect(mockApp.controller.calls.count()).toEqual(1);

                expect(mockApp.service.calls.count()).toEqual(0);
                customRegistrars.services([{ key: "b" }, { key: "b" }]);
                expect(mockApp.service.calls.count()).toEqual(1);

                // None of this should have warned, this is all
                // nominal behavior
                expect(mockLog.warn.calls.count()).toEqual(0);
            });

            it("allows routes to be registered", function () {
                var mockRouteProvider = jasmine.createSpyObj(
                        "$routeProvider",
                        ["when", "otherwise"]
                    ),
                    bundle = {
                        path: "test/bundle",
                        resources: "res"
                    },
                    routes = [
                        {
                            when: "foo",
                            templateUrl: "templates/test.html",
                            bundle: bundle
                        },
                        {
                            templateUrl: "templates/default.html",
                            bundle: bundle
                        }
                    ];

                customRegistrars.routes(routes);

                // Give it the route provider based on its config call
                mockApp.config.calls.all().forEach(function (call) {
                    // Invoke the provided callback
                    call.args[0][1](mockRouteProvider);
                });

                // The "when" clause should have been mapped to the when method...
                expect(mockRouteProvider.when).toHaveBeenCalled();
                expect(mockRouteProvider.when.calls.mostRecent().args[0]).toEqual("foo");
                expect(mockRouteProvider.when.calls.mostRecent().args[1].templateUrl)
                    .toEqual("test/bundle/res/templates/test.html");

                // ...while the other should have been treated as a default route
                expect(mockRouteProvider.otherwise).toHaveBeenCalled();
                expect(mockRouteProvider.otherwise.calls.mostRecent().args[0].templateUrl)
                    .toEqual("test/bundle/res/templates/default.html");
            });

            it("accepts components for service compositing", function () {
                // Most relevant code will be exercised in service compositor spec
                expect(customRegistrars.components).toBeTruthy();
                customRegistrars.components([]);
            });

            it("warns if no implementation is provided for runs", function () {
                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();
                customRegistrars.runs([{ something: "that is not a function"}]);
                expect(mockLog.warn).toHaveBeenCalledWith(jasmine.any(String));
                expect(mockApp.run).not.toHaveBeenCalled();
            });
        });
    }
);
