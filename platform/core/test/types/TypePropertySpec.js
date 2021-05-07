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
    ['../../src/types/TypeProperty'],
    function (TypeProperty) {

        describe("Type property", function () {

            it("allows retrieval of its definition", function () {
                var definition = {
                    key: "hello",
                    someOtherKey: "hm?"
                };
                expect(
                    new TypeProperty(definition).getDefinition()
                ).toEqual(definition);
            });

            it("sets properties in object models", function () {
                var definition = {
                        key: "someKey",
                        property: "someProperty"
                    },
                    model = {},
                    property = new TypeProperty(definition);
                property.setValue(model, "some value");
                expect(model.someProperty).toEqual("some value");
            });

            it("gets properties from object models", function () {
                var definition = {
                        key: "someKey",
                        property: "someProperty"
                    },
                    model = { someProperty: "some value"},
                    property = new TypeProperty(definition);
                expect(property.getValue(model)).toEqual("some value");
            });

            it("sets properties by path", function () {
                var definition = {
                        key: "someKey",
                        property: ["some", "property"]
                    },
                    model = {},
                    property = new TypeProperty(definition);
                property.setValue(model, "some value");
                expect(model.some.property).toEqual("some value");
            });

            it("gets properties by path", function () {
                var definition = {
                        key: "someKey",
                        property: ["some", "property"]
                    },
                    model = { some: { property: "some value" } },
                    property = new TypeProperty(definition);
                expect(property.getValue(model)).toEqual("some value");
            });

            it("stops looking for properties when a path is invalid", function () {
                var definition = {
                        key: "someKey",
                        property: ["some", "property"]
                    },
                    property = new TypeProperty(definition);
                expect(property.getValue(undefined)).toBeUndefined();
            });

            it("gives undefined for empty paths", function () {
                var definition = {
                        key: "someKey",
                        property: []
                    },
                    model = { some: { property: "some value" } },
                    property = new TypeProperty(definition);
                expect(property.getValue(model)).toBeUndefined();
            });

            it("provides empty arrays for values that are array-like", function () {
                var definition = {
                        property: "someProperty",
                        items: [{}, {}, {}]
                    },
                    model = {},
                    property = new TypeProperty(definition);
                expect(property.getValue(model))
                    .toEqual([undefined, undefined, undefined]);
            });

            it("detects and ignores empty arrays on setValue", function () {
                var definition = {
                        property: "someProperty",
                        items: [{}, {}, {}]
                    },
                    model = {},
                    property = new TypeProperty(definition);

                property.setValue(model, [undefined, undefined, undefined]);
                expect(model.someProperty).toBeUndefined();

                // Verify that this only happens when all are undefined
                property.setValue(model, [undefined, "x", 42]);
                expect(model.someProperty).toEqual([undefined, "x", 42]);
            });

        });
    }
);
