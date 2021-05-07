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
    ["../../src/controllers/DateTimePickerController", "moment"],
    function (DateTimePickerController, moment) {

        describe("The DateTimePickerController", function () {
            var mockScope,
                mockNow,
                controller;

            function fireWatch(expr, value) {
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            function fireWatchCollection(expr, value) {
                mockScope.$watchCollection.calls.all().forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$apply", "$watch", "$watchCollection"]
                );
                mockScope.ngModel = {};
                mockScope.field = "testField";
                mockNow = jasmine.createSpy('now');
                controller = new DateTimePickerController(mockScope, mockNow);
            });

            it("watches the model that was passed in", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "ngModel[field]",
                    jasmine.any(Function)
                );
            });

            it("updates value in model when values in scope change", function () {
                mockScope.date = {
                    year: 1998,
                    month: 0,
                    day: 6
                };
                mockScope.time = {
                    hours: 12,
                    minutes: 34,
                    seconds: 56
                };
                fireWatchCollection("date", mockScope.date);
                expect(mockScope.ngModel[mockScope.field])
                    .toEqual(moment.utc("1998-01-06 12:34:56").valueOf());
            });

            describe("once initialized with model state", function () {
                var testTime = moment.utc("1998-01-06 12:34:56").valueOf();

                beforeEach(function () {
                    fireWatch("ngModel[field]", testTime);
                });

                it("exposes date/time values in scope", function () {
                    expect(mockScope.date.year).toEqual(1998);
                    expect(mockScope.date.month).toEqual(0); // Months are zero-indexed
                    expect(mockScope.date.day).toEqual(6);
                    expect(mockScope.time.hours).toEqual(12);
                    expect(mockScope.time.minutes).toEqual(34);
                    expect(mockScope.time.seconds).toEqual(56);
                });

                it("provides names for time properties", function () {
                    Object.keys(mockScope.time).forEach(function (key) {
                        expect(mockScope.nameFor(key))
                            .toEqual(jasmine.any(String));
                    });
                });

                it("provides options for time properties", function () {
                    Object.keys(mockScope.time).forEach(function (key) {
                        expect(mockScope.optionsFor(key))
                            .toEqual(jasmine.any(Array));
                    });
                });

                it("exposes times to populate calendar as a table", function () {
                    // Verify that data structure is as expected by template
                    expect(mockScope.table).toEqual(jasmine.any(Array));
                    expect(mockScope.table[0]).toEqual(jasmine.any(Array));
                    expect(mockScope.table[0][0]).toEqual({
                        year: jasmine.any(Number),
                        month: jasmine.any(Number),
                        day: jasmine.any(Number),
                        dayOfYear: jasmine.any(Number)
                    });
                });

                it("contains the current date in its initial table", function () {
                    var matchingCell;
                    // Should be able to find the selected date
                    mockScope.table.forEach(function (row) {
                        row.forEach(function (cell) {
                            if (cell.dayOfYear === 6) {
                                matchingCell = cell;
                            }
                        });
                    });
                    expect(matchingCell).toEqual({
                        year: 1998,
                        month: 0,
                        day: 6,
                        dayOfYear: 6
                    });
                });

                it("allows the displayed month to be advanced", function () {
                    // Around the edges of the displayed calendar we
                    // may be in previous or subsequent month, so
                    // test around the middle.
                    var i, originalMonth = mockScope.table[2][0].month;

                    function mod12(month) {
                        return ((month % 12) + 12) % 12;
                    }

                    for (i = 1; i <= 12; i += 1) {
                        mockScope.changeMonth(1);
                        expect(mockScope.table[2][0].month)
                            .toEqual(mod12(originalMonth + i));
                    }

                    for (i = 11; i >= -12; i -= 1) {
                        mockScope.changeMonth(-1);
                        expect(mockScope.table[2][0].month)
                            .toEqual(mod12(originalMonth + i));
                    }
                });

                it("allows checking if a cell is in the current month", function () {
                    expect(mockScope.isInCurrentMonth(mockScope.table[2][0]))
                        .toBe(true);
                });

                it("allows cells to be selected", function () {
                    mockScope.select(mockScope.table[2][0]);
                    expect(mockScope.isSelected(mockScope.table[2][0]))
                        .toBe(true);
                    mockScope.select(mockScope.table[2][1]);
                    expect(mockScope.isSelected(mockScope.table[2][0]))
                        .toBe(false);
                    expect(mockScope.isSelected(mockScope.table[2][1]))
                        .toBe(true);
                });

                it("allows cells to be compared", function () {
                    var table = mockScope.table;
                    expect(mockScope.dateEquals(table[2][0], table[2][1]))
                        .toBe(false);
                    expect(mockScope.dateEquals(table[2][1], table[2][1]))
                        .toBe(true);
                });

            });

        });
    }
);
