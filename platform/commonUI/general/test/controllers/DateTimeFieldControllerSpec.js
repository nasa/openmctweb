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
    ["../../src/controllers/DateTimeFieldController", "moment"],
    function (DateTimeFieldController, moment) {

        var TEST_FORMAT = "YYYY-MM-DD HH:mm:ss";

        describe("The DateTimeFieldController", function () {
            var mockScope,
                mockFormatService,
                mockFormat,
                controller;

            function fireWatch(expr, value) {
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$watch']);
                mockFormatService =
                    jasmine.createSpyObj('formatService', ['getFormat']);
                mockFormat = jasmine.createSpyObj('format', [
                    'parse',
                    'validate',
                    'format'
                ]);

                mockFormatService.getFormat.and.returnValue(mockFormat);

                mockFormat.validate.and.callFake(function (text) {
                    return moment.utc(text, TEST_FORMAT).isValid();
                });
                mockFormat.parse.and.callFake(function (text) {
                    return moment.utc(text, TEST_FORMAT).valueOf();
                });
                mockFormat.format.and.callFake(function (value) {
                    return moment.utc(value).format(TEST_FORMAT);
                });

                mockScope.ngModel = { testField: 12321 };
                mockScope.field = "testField";
                mockScope.structure = { format: "someFormat" };
                mockScope.ngBlur = jasmine.createSpy('blur');

                controller = new DateTimeFieldController(
                    mockScope,
                    mockFormatService
                );
                fireWatch("ngModel[field]", mockScope.ngModel.testField);
            });

            it("updates text from model values", function () {
                var testTime = mockFormat.parse("1977-05-25 17:30:00");
                mockScope.ngModel.testField = testTime;
                fireWatch("ngModel[field]", testTime);
                expect(mockScope.textValue).toEqual("1977-05-25 17:30:00");
            });

            describe("when valid text is entered", function () {
                var newText;

                beforeEach(function () {
                    newText = "1977-05-25 17:30:00";
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                });

                it("updates models from user-entered text", function () {
                    expect(mockScope.ngModel.testField)
                        .toEqual(mockFormat.parse(newText));
                    expect(mockScope.textInvalid).toBeFalsy();
                });

                it("does not indicate a blur event", function () {
                    expect(mockScope.ngBlur).not.toHaveBeenCalled();
                });
            });

            describe("when a date is chosen via the date picker", function () {
                var newValue;

                beforeEach(function () {
                    newValue = 12345654321;
                    mockScope.pickerModel.value = newValue;
                    fireWatch("pickerModel.value", newValue);
                });

                it("updates models", function () {
                    expect(mockScope.ngModel.testField).toEqual(newValue);
                });

                it("fires a blur event", function () {
                    expect(mockScope.ngBlur).toHaveBeenCalled();
                });
            });

            it("exposes toggle state for date-time picker", function () {
                expect(mockScope.picker.active).toBe(false);
            });

            describe("when user input is invalid", function () {
                var newText, oldText, oldValue;

                beforeEach(function () {
                    newText = "Not a date";
                    oldValue = mockScope.ngModel.testField;
                    oldText = mockScope.textValue;
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                });

                it("displays error state", function () {
                    expect(mockScope.textInvalid).toBeTruthy();
                });

                it("does not modify model state", function () {
                    expect(mockScope.ngModel.testField).toEqual(oldValue);
                });

                it("does not modify user input", function () {
                    expect(mockScope.textValue).toEqual(newText);
                });

                it("restores valid text values on request", function () {
                    mockScope.restoreTextValue();
                    expect(mockScope.textValue).toEqual(oldText);
                });
            });

            it("does not modify valid but irregular user input", function () {
                // Don't want the controller "fixing" bad or
                // irregularly-formatted input out from under
                // the user's fingertips.
                var newText = "2015-3-3 01:02:04",
                    oldValue = mockScope.ngModel.testField;

                mockFormat.validate.and.returnValue(true);
                mockFormat.parse.and.returnValue(42);
                mockScope.textValue = newText;
                fireWatch("textValue", newText);

                expect(mockScope.textValue).toEqual(newText);
                expect(mockScope.ngModel.testField).toEqual(42);
                expect(mockScope.ngModel.testField).not.toEqual(oldValue);
            });

            it("obtains a format from the format service", function () {
                fireWatch('structure.format', mockScope.structure.format);
                expect(mockFormatService.getFormat)
                    .toHaveBeenCalledWith(mockScope.structure.format);
            });

            it("throws an error for unknown formats", function () {
                mockFormatService.getFormat.and.returnValue(undefined);
                expect(function () {
                    fireWatch("structure.format", "some-format");
                }).toThrow();
            });

            describe("using the obtained format", function () {
                var testValue = 1234321,
                    testText = "some text";

                beforeEach(function () {
                    mockFormat.validate.and.returnValue(true);
                    mockFormat.parse.and.returnValue(testValue);
                    mockFormat.format.and.returnValue(testText);
                });

                it("parses user input", function () {
                    var newText = "some other new text";
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                    expect(mockFormat.parse).toHaveBeenCalledWith(newText);
                    expect(mockScope.ngModel.testField).toEqual(testValue);
                });

                it("validates user input", function () {
                    var newText = "some other new text";
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                    expect(mockFormat.validate).toHaveBeenCalledWith(newText);
                });

                it("formats model data for display", function () {
                    var newValue = 42;
                    mockScope.ngModel.testField = newValue;
                    fireWatch("ngModel[field]", newValue);
                    expect(mockFormat.format).toHaveBeenCalledWith(newValue);
                    expect(mockScope.textValue).toEqual(testText);
                });
            });

        });
    }
);
