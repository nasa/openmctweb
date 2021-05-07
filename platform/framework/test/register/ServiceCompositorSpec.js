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
 * ServiceCompositorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/ServiceCompositor"],
    function (ServiceCompositor) {

        describe("The service compositor", function () {
            var registered,
                mockApp,
                mockLog,
                compositor;

            beforeEach(function () {
                registered = {};

                mockApp = jasmine.createSpyObj("app", ["service"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);

                mockApp.service.and.callFake(function (name, value) {
                    var factory = value[value.length - 1];

                    registered[name] = {
                        depends: value.slice(0, value.length - 1),
                        callback: value[value.length - 1]
                    };

                    // Track what name it was registered under
                    factory.registeredName = name;
                });

                compositor = new ServiceCompositor(mockApp, mockLog);
            });

            it("allows composite services to be registered", function () {
                compositor.registerCompositeServices([
                    {
                        type: "provider",
                        provides: "testService"
                    }
                ]);

                expect(mockApp.service).toHaveBeenCalled();
            });

            it("allows composite services to be registered", function () {
                // Prepare components that look like resolved extensions
                var components, name;
                function MyDecorator() {
                    return {};
                }

                function MyOtherDecorator() {
                    return {};
                }

                function MyProvider() {
                    return {};
                }

                function MyOtherProvider() {
                    return {};
                }

                function MyAggregator() {
                    return {};
                }

                components = [
                    MyDecorator,
                    MyProvider,
                    MyAggregator,
                    MyOtherDecorator,
                    MyOtherProvider
                ];

                MyDecorator.type = "decorator";
                MyOtherDecorator.type = "decorator";
                MyProvider.type = "provider";
                MyOtherProvider.type = "provider";
                MyAggregator.type = "aggregator";
                components.forEach(function (c) {
                    c.provides = "testService";
                });

                // Add some test dependencies, to check prepending
                MyOtherDecorator.depends = ["someOtherService"];
                MyAggregator.depends = ["tests[]"];

                // Register!
                compositor.registerCompositeServices(components);

                expect(mockApp.service).toHaveBeenCalled();

                // Verify some interesting spots on dependency graph
                expect(registered.testService.depends).toEqual([
                    MyOtherDecorator.registeredName
                ]);
                expect(registered[MyOtherDecorator.registeredName].depends).toEqual([
                    "someOtherService",
                    MyDecorator.registeredName
                ]);
                expect(registered[MyAggregator.registeredName].depends.length).toEqual(2);
                // Get the name of the group of providers
                name = registered[MyAggregator.registeredName].depends[1];
                // ...it should depend on both providers
                expect(registered[name].depends).toEqual([
                    MyProvider.registeredName,
                    MyOtherProvider.registeredName
                ]);
            });

            it("allows registered composite services to be instantiated", function () {
                // Prepare components that look like resolved extensions
                var components, name;
                function MyProvider() {
                    return {};
                }

                function MyOtherProvider() {
                    return {};
                }

                function MyAggregator() {
                    return {};
                }

                components = [MyProvider, MyAggregator, MyOtherProvider];

                MyProvider.type = "provider";
                MyOtherProvider.type = "provider";
                MyAggregator.type = "aggregator";
                components.forEach(function (c) {
                    c.provides = "testService";
                });

                // Register!
                compositor.registerCompositeServices(components);

                expect(mockApp.service).toHaveBeenCalled();

                // Test service should just be a reflecting dependency;
                // it will depend upon (then return) the aggregator.
                expect(registered.testService.callback("hello")).toEqual("hello");

                // The aggregated provider dependencies should be similar,
                // except they should reflect back the array of arguments.
                // Get the name of the group of providers
                name = registered[MyAggregator.registeredName].depends[0];
                // ...it should depend on both providers
                expect(registered[name].callback(1, 2, "hello")).toEqual([1, 2, "hello"]);

            });

            it("warns and skips components with no service type", function () {
                // Prepare components that look like resolved extensions
                var components;
                function MyProvider() {
                    return {};
                }

                function MyDecorator() {
                    return {};
                }

                function MyAggregator() {
                    return {};
                }

                components = [MyProvider, MyAggregator, MyDecorator];

                MyProvider.type = "provider";
                MyDecorator.type = "decorator";
                MyAggregator.type = "aggregator";

                // Notably, we don't do
                // components.forEach(function (c) { c.provides = "testService"; });

                // Try to register...
                compositor.registerCompositeServices(components);

                // Nothing should have gotten registered
                expect(mockApp.service).not.toHaveBeenCalled();

                // Should have gotten one warning for each skipped component
                expect(mockLog.warn.calls.count()).toEqual(2);
                expect(mockLog.info.calls.count()).toEqual(1);
            });

            it("warns about and skips aggregators with zero providers", function () {
                // Prepare components that look like resolved extensions
                var components;
                function MyAggregator() {
                    return {};
                }

                components = [MyAggregator];

                MyAggregator.type = "aggregator";
                MyAggregator.provides = "testService";

                // Try to register...
                compositor.registerCompositeServices(components);

                // Nothing should have gotten registered
                expect(mockApp.service).not.toHaveBeenCalled();

                // Should have gotten a warning
                expect(mockLog.info).toHaveBeenCalled();
            });

            it("warns about and skips decorators with nothing to decorate", function () {
                // Prepare components that look like resolved extensions
                var components;
                function MyDecorator() {
                    return {};
                }

                components = [MyDecorator];

                MyDecorator.type = "decorator";
                MyDecorator.provides = "testService";

                // Try to register...
                compositor.registerCompositeServices(components);

                // Nothing should have gotten registered
                expect(mockApp.service).not.toHaveBeenCalled();

                // Should have gotten a warning
                expect(mockLog.warn).toHaveBeenCalled();
            });

        });
    }
);
