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
    ["../../src/controllers/SelectorController"],
    function (SelectorController) {

        describe("The controller for the 'selector' control", function () {
            var mockObjectService,
                mockScope,
                mockDomainObject,
                mockType,
                mockDomainObjects,
                controller;

            function promiseOf(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return promiseOf(callback(v));
                    }
                };
            }

            function makeMockObject(id) {
                var mockObject = jasmine.createSpyObj(
                    'object-' + id,
                    ['getId']
                );
                mockObject.getId.and.returnValue(id);

                return mockObject;
            }

            beforeEach(function () {
                mockObjectService = jasmine.createSpyObj(
                    'objectService',
                    ['getObjects']
                );
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    ['$watch', '$watchCollection']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'hasCapability']
                );
                mockType = jasmine.createSpyObj(
                    'type',
                    ['instanceOf']
                );
                mockDomainObjects = {};

                ["ROOT", "abc", "def", "xyz"].forEach(function (id) {
                    mockDomainObjects[id] = makeMockObject(id);
                });

                mockDomainObject.getCapability.and.returnValue(mockType);
                mockObjectService.getObjects.and.returnValue(promiseOf(mockDomainObjects));
                mockScope.field = "testField";
                mockScope.ngModel = {};

                controller = new SelectorController(
                    mockObjectService,
                    mockScope
                );
            });

            it("loads the root object", function () {
                expect(mockObjectService.getObjects)
                    .toHaveBeenCalledWith(["ROOT"]);
            });

            it("watches for changes in selection in left-hand tree", function () {
                var testObject = {
                    a: 123,
                    b: 456
                };
                // This test is sensitive to ordering of watch calls
                expect(mockScope.$watch.calls.count()).toEqual(1);
                // Make sure we're watching the correct object
                controller.treeModel.selectedObject = testObject;
                expect(mockScope.$watch.calls.all()[0].args[0]()).toBe(testObject);
            });

            it("watches for changes in controlled property", function () {
                var testValue = ["a", "b", 1, 2];
                // This test is sensitive to ordering of watch calls
                expect(mockScope.$watchCollection.calls.count()).toEqual(1);
                // Make sure we're watching the correct object
                mockScope.ngModel = { testField: testValue };
                expect(mockScope.$watchCollection.calls.all()[0].args[0]()).toBe(testValue);
            });

            it("rejects selection of incorrect types", function () {
                mockScope.structure = { type: "someType" };
                mockType.instanceOf.and.returnValue(false);
                controller.treeModel.selectedObject = mockDomainObject;
                // Fire the watch
                mockScope.$watch.calls.all()[0].args[1](mockDomainObject);
                // Should have cleared the selection
                expect(controller.treeModel.selectedObject).toBeUndefined();
                // Verify interaction (that instanceOf got a useful argument)
                expect(mockType.instanceOf).toHaveBeenCalledWith("someType");
            });

            it("permits selection of matching types", function () {
                mockScope.structure = { type: "someType" };
                mockType.instanceOf.and.returnValue(true);
                controller.treeModel.selectedObject = mockDomainObject;
                // Fire the watch
                mockScope.$watch.calls.all()[0].args[1](mockDomainObject);
                // Should have preserved the selection
                expect(controller.treeModel.selectedObject).toEqual(mockDomainObject);
                // Verify interaction (that instanceOf got a useful argument)
                expect(mockType.instanceOf).toHaveBeenCalledWith("someType");
            });

            it("loads objects when the underlying list changes", function () {
                var testIds = ["abc", "def", "xyz"];
                // This test is sensitive to ordering of watch calls
                expect(mockScope.$watchCollection.calls.count()).toEqual(1);
                // Make sure we're watching the correct object
                mockScope.ngModel = { testField: testIds };
                // Fire the watch
                mockScope.$watchCollection.calls.all()[0].args[1](testIds);
                // Should have loaded the corresponding objects
                expect(mockObjectService.getObjects).toHaveBeenCalledWith(testIds);
            });

            it("exposes the root object to populate the left-hand tree", function () {
                expect(controller.root()).toEqual(mockDomainObjects.ROOT);
            });

            it("adds objects to the underlying model", function () {
                expect(mockScope.ngModel.testField).toBeUndefined();
                controller.select(mockDomainObjects.def);
                expect(mockScope.ngModel.testField).toEqual(["def"]);
                controller.select(mockDomainObjects.abc);
                expect(mockScope.ngModel.testField).toEqual(["def", "abc"]);
            });

            it("removes objects to the underlying model", function () {
                controller.select(mockDomainObjects.def);
                controller.select(mockDomainObjects.abc);
                expect(mockScope.ngModel.testField).toEqual(["def", "abc"]);
                controller.deselect(mockDomainObjects.def);
                expect(mockScope.ngModel.testField).toEqual(["abc"]);
            });

            it("provides a list of currently-selected objects", function () {
                // Verify precondition
                expect(controller.selected()).toEqual([]);
                // Select some objects
                controller.select(mockDomainObjects.def);
                controller.select(mockDomainObjects.abc);
                // Fire the watch for the id changes...
                mockScope.$watchCollection.calls.all()[0].args[1](
                    mockScope.$watchCollection.calls.all()[0].args[0]()
                );
                // Should have loaded and exposed those objects
                expect(controller.selected()).toEqual(
                    [mockDomainObjects.def, mockDomainObjects.abc]
                );
            });
        });
    }
);
