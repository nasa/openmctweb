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
 * ExtensionRegistrarSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/ExtensionRegistrar"],
    function (ExtensionRegistrar) {

        describe("The extension registrar", function () {
            var mockApp,
                mockLog,
                mockSorter,
                customRegistrars,
                registrar;

            beforeEach(function () {
                mockApp = jasmine.createSpyObj("app", ["factory"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "debug", "info"]);
                mockSorter = jasmine.createSpyObj("sorter", ["sort"]);
                customRegistrars = {};

                mockSorter.sort.and.callFake(function (v) {
                    return v;
                });

                registrar = new ExtensionRegistrar(
                    mockApp,
                    customRegistrars,
                    mockSorter,
                    mockLog
                );
            });

            it("registers extensions using the factory", function () {
                registrar.registerExtensions({ things: [{}] });
                expect(mockApp.factory).toHaveBeenCalled();
            });

            it("registers extensions with square brackets, as arrays", function () {
                var callbacks = {};
                mockApp.factory.and.callFake(function (name, value) {
                    callbacks[name] = value[value.length - 1];
                });
                registrar.registerExtensions({ things: [{}] });
                expect(callbacks["things[]"]).toBeDefined();

                // Verify dependency echo behavior
                expect(callbacks["things[]"]("a", "b", "c")).toEqual(["a", "b", "c"]);
            });

            it("warns if multiple registrations are made for the same category of extension", function () {
                registrar.registerExtensions({ things: [{}] });
                expect(mockLog.warn).not.toHaveBeenCalled();
                registrar.registerExtensions({ things: [{}] });
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("registers empty extension categories when they are needed", function () {
                var lengths = {};
                mockApp.factory.and.callFake(function (name, value) {
                    lengths[name] = value.length;
                });
                // Nobody has registered tests[], but it looks like an extension dependency,
                // so register it as an empty array.
                registrar.registerExtensions({ things: [{ depends: ["tests[]", "other"] }] });
                expect(lengths["tests[]"]).toEqual(1);
                expect(lengths.other).toBeUndefined();
            });

            it("invokes custom registrars (not app.factory) when available", function () {
                customRegistrars.things = jasmine.createSpy("things");
                registrar.registerExtensions({ things: [{}] });
                expect(mockApp.factory).not.toHaveBeenCalled();
                expect(customRegistrars.things).toHaveBeenCalled();
            });

            it("sorts extensions before registering", function () {
                // Some extension definitions to sort
                var a = { a: 'a' }, b = { b: 'b' }, c = { c: 'c' };

                // Fake sorting; just reverse the array
                mockSorter.sort.and.callFake(function (v) {
                    return v.reverse();
                });

                // Register the extensions
                registrar.registerExtensions({ things: [a, b, c] });

                // Verify registration interactions occurred in reverse-order
                [c, b, a].forEach(function (extension, index) {
                    expect(mockApp.factory.calls.all()[index].args[1][0]())
                        .toEqual(extension);
                });
            });

        });
    }
);
