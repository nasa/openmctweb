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
    ["../../src/controllers/GetterSetterController"],
    function (GetterSetterController) {

        describe("The getter-setter controller", function () {
            var mockScope,
                mockModel,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockModel = jasmine.createSpy("ngModel");
                mockScope.ngModel = mockModel;
                controller = new GetterSetterController(mockScope);
            });

            it("watches for changes to external and internal mode", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "ngModel()",
                    jasmine.any(Function)
                );
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "getterSetter.value",
                    jasmine.any(Function)
                );
            });

            it("updates an external function when changes are detected", function () {
                mockScope.getterSetter.value = "some new value";
                // Verify precondition
                expect(mockScope.ngModel)
                    .not.toHaveBeenCalledWith("some new value");
                // Fire the matching watcher
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === "getterSetter.value") {
                        call.args[1](mockScope.getterSetter.value);
                    }
                });
                // Verify getter-setter was notified
                expect(mockScope.ngModel)
                    .toHaveBeenCalledWith("some new value");
            });

            it("updates internal state when external changes are detected", function () {
                mockScope.ngModel.and.returnValue("some other new value");
                // Verify precondition
                expect(mockScope.getterSetter.value).toBeUndefined();
                // Fire the matching watcher
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === "ngModel()") {
                        call.args[1]("some other new value");
                    }
                });
                // Verify state in scope was updated
                expect(mockScope.getterSetter.value)
                    .toEqual("some other new value");
            });

        });
    }
);
