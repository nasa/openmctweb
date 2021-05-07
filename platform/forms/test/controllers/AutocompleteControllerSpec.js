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

define([
    "../../src/controllers/AutocompleteController",
    "angular"
], function (
    AutocompleteController,
    angular
) {

    describe("The autocomplete controller", function () {
        var mockScope,
            mockElement,
            controller;

        beforeEach(function () {
            mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
            mockScope.options = ['Asia/Dhaka', 'UTC', 'Toronto', 'Asia/Shanghai', 'Hotel California'];
            mockScope.ngModel = [null, null, null, null, null];
            mockScope.field = 4;
            mockElement = angular.element("<div></div>");
            controller = new AutocompleteController(mockScope, mockElement);
        });

        it("makes optionNames array equal to options if options is an array of string", function () {
            expect(mockScope.optionNames).toEqual(mockScope.options);
        });

        it("filters options by returning array containing optionId and name", function () {
            mockScope.filterOptions('Asia');
            var filteredOptions = [{
                optionId: 0,
                name: 'Asia/Dhaka'
            },
            {
                optionId: 1,
                name: 'Asia/Shanghai'
            }];
            expect(mockScope.filteredOptions).toEqual(filteredOptions);
        });

        it("fills input with given string", function () {
            var str = "UTC";
            mockScope.fillInput(str);
            expect(mockScope.hideOptions).toEqual(true);
            expect(mockScope.ngModel[mockScope.field]).toEqual(str);
        });

        it("sets a new optionIndex on mouse hover", function () {
            mockScope.optionMouseover(1);
            expect(mockScope.optionIndex).toEqual(1);
        });

    });
});
