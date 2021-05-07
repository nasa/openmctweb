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
    ["../../src/identifiers/Identifier"],
    function (Identifier) {

        describe("A parsed domain object identifier", function () {
            var id,
                defaultSpace,
                identifier;

            beforeEach(function () {
                defaultSpace = "someDefaultSpace";
            });

            describe("when space is encoded", function () {
                var idSpace, idKey;

                beforeEach(function () {
                    idSpace = "a-specific-space";
                    idKey = "a-specific-key";
                    id = idSpace + ":" + idKey;
                    identifier = new Identifier(id, defaultSpace);
                });

                it("provides the encoded space", function () {
                    expect(identifier.getSpace()).toEqual(idSpace);
                });

                it("provides the key within that space", function () {
                    expect(identifier.getKey()).toEqual(idKey);
                });

                it("provides the defined space", function () {
                    expect(identifier.getDefinedSpace()).toEqual(idSpace);
                });
            });

            describe("when space is not encoded", function () {
                beforeEach(function () {
                    id = "a-generic-id";
                    identifier = new Identifier(id, defaultSpace);
                });

                it("provides the default space", function () {
                    expect(identifier.getSpace()).toEqual(defaultSpace);
                });

                it("provides the id as the key", function () {
                    expect(identifier.getKey()).toEqual(id);
                });

                it("provides no defined space", function () {
                    expect(identifier.getDefinedSpace()).toEqual(undefined);
                });
            });

        });
    }
);
