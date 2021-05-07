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
    [
        '../../src/services/LocationService'
    ],
    function (LocationService) {

        describe("LocationService", function () {
            var dialogService,
                locationService,
                dialogServicePromise,
                chainedPromise;

            beforeEach(function () {
                dialogService = jasmine.createSpyObj(
                    'dialogService',
                    ['getUserInput']
                );
                dialogServicePromise = jasmine.createSpyObj(
                    'dialogServicePromise',
                    ['then']
                );
                chainedPromise = jasmine.createSpyObj(
                    'chainedPromise',
                    ['then']
                );
                dialogServicePromise.then.and.returnValue(chainedPromise);
                dialogService.getUserInput.and.returnValue(dialogServicePromise);
                locationService = new LocationService(dialogService);
            });

            describe("getLocationFromUser", function () {
                var title,
                    label,
                    validate,
                    initialLocation,
                    locationResult,
                    formStructure,
                    formState;

                beforeEach(function () {
                    title = "Get a location to do something";
                    label = "a location";
                    validate = function () {
                        return true;
                    };

                    initialLocation = { key: "a key" };
                    locationResult = locationService.getLocationFromUser(
                        title,
                        label,
                        validate,
                        initialLocation
                    );
                    formStructure = dialogService
                        .getUserInput
                        .calls.mostRecent()
                        .args[0];
                    formState = dialogService
                        .getUserInput
                        .calls.mostRecent()
                        .args[1];
                });

                it("calls through to dialogService", function () {
                    expect(dialogService.getUserInput).toHaveBeenCalledWith(
                        jasmine.any(Object),
                        jasmine.any(Object)
                    );
                    expect(formStructure.name).toBe(title);
                });

                it("returns a promise", function () {
                    expect(locationResult.then).toBeDefined();
                });

                describe("formStructure", function () {
                    var locationSection,
                        inputRow;

                    beforeEach(function () {
                        locationSection = formStructure.sections[0];
                        inputRow = locationSection.rows[0];
                    });

                    it("has a location section", function () {
                        expect(locationSection).toBeDefined();
                        expect(locationSection.name).toBe('Location');
                    });

                    it("has a input row", function () {
                        expect(inputRow.control).toBe('locator');
                        expect(inputRow.key).toBe('location');
                        expect(inputRow.name).toBe(label);
                        expect(inputRow.validate).toBe(validate);
                    });
                });

                describe("formState", function () {
                    it("has an initial location", function () {
                        expect(formState.location).toBe(initialLocation);
                    });
                });

                describe("resolution of dialog service promise", function () {
                    var resolution,
                        resolver,
                        dialogResult,
                        selectedLocation;

                    beforeEach(function () {
                        resolver =
                            dialogServicePromise.then.calls.mostRecent().args[0];

                        selectedLocation = { key: "i'm a location key" };
                        dialogResult = {
                            location: selectedLocation
                        };

                        resolution = resolver(dialogResult);
                    });

                    it("returns selectedLocation", function () {
                        expect(resolution).toBe(selectedLocation);
                    });
                });
            });
        });
    }
);
