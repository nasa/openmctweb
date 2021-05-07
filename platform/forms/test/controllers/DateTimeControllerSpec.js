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
    ["../../src/controllers/DateTimeController"],
    function (DateTimeController) {

        describe("The date-time controller", function () {
            var mockScope,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                controller = new DateTimeController(mockScope);
            });

            it("watches for changes in fields", function () {
                ["date", "hour", "min", "sec"].forEach(function (fieldName) {
                    expect(mockScope.$watch).toHaveBeenCalledWith(
                        "datetime." + fieldName,
                        jasmine.any(Function)
                    );
                });
            });

            it("converts date-time input into a timestamp", function () {
                mockScope.ngModel = {};
                mockScope.field = "test";
                mockScope.datetime.date = "2014-11-28";
                mockScope.datetime.hour = 22;
                mockScope.datetime.min = 55;
                mockScope.datetime.sec = 13;

                mockScope.$watch.calls.mostRecent().args[1]();

                expect(mockScope.ngModel.test).toEqual(1417215313000);
            });

            it("reports when form input is partially complete", function () {
                // This is needed to flag the control's state as invalid
                // when it is partially complete without having it treated
                // as required.
                mockScope.ngModel = {};
                mockScope.field = "test";
                mockScope.datetime.date = "2014-11-28";
                mockScope.datetime.hour = 22;
                mockScope.datetime.min = 55;
                // mockScope.datetime.sec = 13;

                mockScope.$watch.calls.mostRecent().args[1]();

                expect(mockScope.partiallyComplete).toBeTruthy();
            });

            it("reports 'undefined' for empty input", function () {
                mockScope.ngModel = { test: 12345 };
                mockScope.field = "test";
                mockScope.$watch.calls.mostRecent().args[1]();
                // Clear all inputs
                mockScope.datetime = {};
                mockScope.$watch.calls.mostRecent().args[1]();

                // Should have cleared out the time stamp
                expect(mockScope.ngModel.test).toBeUndefined();
            });

            it("exposes date-time format for placeholder", function () {
                expect(mockScope.format).toEqual(jasmine.any(String));
                expect(mockScope.format.length).toBeGreaterThan(0);
            });
            it("initializes form fields with values from ng-model", function () {
                mockScope.ngModel = { test: 1417215313000 };
                mockScope.field = "test";
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === 'ngModel[field]') {
                        call.args[1](mockScope.ngModel.test);
                    }
                });
                expect(mockScope.datetime).toEqual({
                    date: "2014-11-28",
                    hour: "22",
                    min: "55",
                    sec: "13"
                });
            });
        });
    }
);
