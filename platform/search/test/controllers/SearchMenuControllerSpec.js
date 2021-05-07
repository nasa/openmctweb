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

/**
 *  SearchSpec. Created by shale on 08/17/2015.
 */
define(
    ["../../src/controllers/SearchMenuController"],
    function (SearchMenuController) {

        describe("The search menu controller", function () {
            var mockScope,
                mockTypes,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [""]
                );

                mockTypes = [
                    {
                        key: 'mock.type.1',
                        name: 'Mock Type 1',
                        cssClass: 'icon-layout'
                    },
                    {
                        key: 'mock.type.2',
                        name: 'Mock Type 2',
                        cssClass: 'icon-telemetry'
                    }
                ];

                mockScope.ngModel = {};
                mockScope.ngModel.checked = {};
                mockScope.ngModel.checked['mock.type.1'] = false;
                mockScope.ngModel.checked['mock.type.2'] = false;
                mockScope.ngModel.checkAll = true;
                mockScope.ngModel.filter = jasmine.createSpy('$scope.ngModel.filter');
                mockScope.ngModel.filtersString = '';

                controller = new SearchMenuController(mockScope, mockTypes);
            });

            it("gets types on initialization", function () {
                expect(mockScope.ngModel.types).toBeDefined();
            });

            it("refilters results when options are updated", function () {
                controller.updateOptions();
                expect(mockScope.ngModel.filter).toHaveBeenCalled();

                controller.checkAll();
                expect(mockScope.ngModel.filter).toHaveBeenCalled();
            });

            it("updates the filters string when options are updated", function () {
                controller.updateOptions();
                expect(mockScope.ngModel.filtersString).toEqual('');

                mockScope.ngModel.checked['mock.type.1'] = true;

                controller.updateOptions();
                expect(mockScope.ngModel.filtersString).not.toEqual('');
            });

            it("changing checkAll status sets checkAll to true", function () {
                controller.checkAll();
                expect(mockScope.ngModel.checkAll).toEqual(true);
                expect(mockScope.ngModel.filtersString).toEqual('');

                mockScope.ngModel.checkAll = false;

                controller.checkAll();
                expect(mockScope.ngModel.checkAll).toEqual(true);
                expect(mockScope.ngModel.filtersString).toEqual('');
            });

            it("checking checkAll option resets other options", function () {
                mockScope.ngModel.checked['mock.type.1'] = true;
                mockScope.ngModel.checked['mock.type.2'] = true;

                controller.checkAll();

                Object.keys(mockScope.ngModel.checked).forEach(function (type) {
                    expect(mockScope.ngModel.checked[type]).toBeFalsy();
                });
            });

            it("checks checkAll when no options are checked", function () {
                Object.keys(mockScope.ngModel.checked).forEach(function (type) {
                    mockScope.ngModel.checked[type] = false;
                });
                mockScope.ngModel.checkAll = false;

                controller.updateOptions();

                expect(mockScope.ngModel.filtersString).toEqual('');
                expect(mockScope.ngModel.checkAll).toEqual(true);
            });

            it("tells the user when options are checked", function () {
                mockScope.ngModel.checkAll = false;
                Object.keys(mockScope.ngModel.checked).forEach(function (type) {
                    mockScope.ngModel.checked[type] = true;
                });

                controller.updateOptions();

                expect(mockScope.ngModel.filtersString).not.toEqual('');
            });
        });
    }
);
