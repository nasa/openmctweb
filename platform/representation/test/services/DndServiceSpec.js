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
    ["../../src/services/DndService"],
    function (DndService) {

        describe("The drag-and-drop service", function () {
            var service;

            beforeEach(function () {
                var mockLog = jasmine.createSpyObj("$log", ['debug']);
                service = new DndService(mockLog);
            });

            it("allows setting of arbitrary objects", function () {
                var foo = {
                    bar: function () {
                        return 42;
                    }
                };

                service.setData('xyz', foo);

                // Test that we can get back callable data, since this is
                // a key reason for having a service separate from HTML5 DnD.
                expect(service.getData('xyz').bar()).toEqual(42);
            });

            it("stores data under specified keys", function () {
                service.setData('abc', 42);
                service.setData('def', "some data");

                expect(service.getData('abc')).toEqual(42);
                expect(service.getData('def')).toEqual("some data");
            });

            it("removes data", function () {
                service.setData('abc', 42);
                service.removeData('abc');
                expect(service.getData('abc')).toBeUndefined();
            });

        });
    }
);
