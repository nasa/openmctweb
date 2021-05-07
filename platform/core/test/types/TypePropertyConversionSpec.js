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

define(
    ['../../src/types/TypePropertyConversion'],
    function (TypePropertyConversion) {

        describe("Type property conversion", function () {

            it("allows non-conversion when parameter is 'identity'", function () {
                var conversion = new TypePropertyConversion("identity");
                [42, "42", { a: 42 }].forEach(function (v) {
                    expect(conversion.toFormValue(v)).toBe(v);
                    expect(conversion.toModelValue(v)).toBe(v);
                });
            });

            it("allows numeric conversion", function () {
                var conversion = new TypePropertyConversion("number");
                expect(conversion.toFormValue(42)).toBe("42");
                expect(conversion.toModelValue("42")).toBe(42);
            });

            it("supports array conversions", function () {
                var conversion = new TypePropertyConversion("number[]");
                expect(conversion.toFormValue([42, 44]).length).toEqual(2);
                expect(conversion.toFormValue([42, 44])[0]).toBe("42");
                expect(conversion.toModelValue(["11", "42"])[1]).toBe(42);
            });

            it("throws exceptions on unrecognized conversions", function () {
                var caught = false;

                try {
                    // eslint-disable-next-line
                    new TypePropertyConversion("some-unknown-conversion");
                } catch (e) {
                    caught = true;
                }

                expect(caught).toBeTruthy();
            });

        });
    }
);
