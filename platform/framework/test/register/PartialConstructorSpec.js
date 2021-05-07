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
 * PartialConstructorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/PartialConstructor"],
    function (PartialConstructor) {

        describe("A partial constructor", function () {
            var result,
                PartializedConstructor;

            function RegularConstructor(a, b, c, d) {
                result = {
                    a: a,
                    b: b,
                    c: c,
                    d: d
                };

                return result;
            }

            function ThisStyleConstructor(x, y, z) {
                this.message = [x, y, z].join(" ");
            }

            RegularConstructor.someProperty = "test property";

            beforeEach(function () {
                result = undefined;
                PartializedConstructor = new PartialConstructor(RegularConstructor);
            });

            it("splits a constructor call into two stages", function () {
                var RemainingConstructor = new PartializedConstructor("test"),
                    instance;
                // first call should not have hit constructor
                expect(result).toBeUndefined();

                // Call again
                instance = new RemainingConstructor(1, 2, 3);
                expect(result).toEqual({
                    a: "test",
                    b: 1,
                    c: 2,
                    d: 3
                });

                // Should have returned the constructor's value
                expect(instance).toEqual(result);
            });

            it("handles this-style constructors", function () {
                var Partialized = new PartialConstructor(ThisStyleConstructor),
                    Remaining = new Partialized("this"),
                    instance = new Remaining("is", "correct");

                // We should have everything we put in "this", and we
                // should still pass an instanceof test.g
                expect(instance.message).toEqual("this is correct");
                expect(instance).toEqual(new ThisStyleConstructor("this", "is", "correct"));
                expect(instance instanceof ThisStyleConstructor).toBeTruthy();
            });

            it("retains static properties after partialization", function () {
                // This string should appear after invoking the partialized
                // constructor, such that the resulting inner constructor
                // exposes these as if we were looking at the original
                // RegularConstructor.
                expect(new PartializedConstructor().someProperty).toEqual("test property");
            });

        });
    }
);
