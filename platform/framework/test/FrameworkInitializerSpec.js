/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,runs*/

/**
 * FrameworkInitializerSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/FrameworkInitializer"],
    function (FrameworkInitializer) {
        "use strict";

        describe("The framework initializer", function () {
            var initializer;

            function appender(name) {
                return function (value) {
                    return Promise.resolve(value.concat([name]));
                };
            }

            beforeEach(function () {
                initializer = new FrameworkInitializer(
                    { loadBundles: appender("loader") },
                    { resolveBundles: appender("resolver") },
                    { registerExtensions: appender("registrar") },
                    { bootstrap: appender("bootstrapper")}
                );
            });

            // Really just delegates work, can only verify the
            // order of calls.
            it("calls injected stages in order", function () {
                var result;

                initializer.runApplication([]).then(function (v) { result = v; });

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                runs(function () {
                    expect(result).toEqual(
                        ["loader", "resolver", "registrar", "bootstrapper"]
                    );
                });
            });

        });
    }
);