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
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/navigation/NavigationService"],
    function (NavigationService) {

        describe("The navigation service", function () {
            var $window,
                navigationService;

            beforeEach(function () {
                $window = jasmine.createSpyObj('$window', ['confirm']);
                navigationService = new NavigationService($window);
            });

            it("stores navigation state", function () {
                var testObject = { someKey: 42 },
                    otherObject = { someKey: "some value" };
                expect(navigationService.getNavigation())
                    .toBeUndefined();
                navigationService.setNavigation(testObject);
                expect(navigationService.getNavigation())
                    .toBe(testObject);
                expect(navigationService.getNavigation())
                    .toBe(testObject);
                navigationService.setNavigation(otherObject);
                expect(navigationService.getNavigation())
                    .toBe(otherObject);
            });

            it("notifies listeners on change", function () {
                var testObject = { someKey: 42 },
                    callback = jasmine.createSpy("callback");

                navigationService.addListener(callback);
                expect(callback).not.toHaveBeenCalled();

                navigationService.setNavigation(testObject);
                expect(callback).toHaveBeenCalledWith(testObject);
            });

            it("does not notify listeners when no changes occur", function () {
                var testObject = { someKey: 42 },
                    callback = jasmine.createSpy("callback");

                navigationService.addListener(callback);
                navigationService.setNavigation(testObject);
                navigationService.setNavigation(testObject);
                expect(callback.calls.count()).toEqual(1);
            });

            it("stops notifying listeners after removal", function () {
                var testObject = { someKey: 42 },
                    callback = jasmine.createSpy("callback");

                navigationService.addListener(callback);
                navigationService.removeListener(callback);

                navigationService.setNavigation(testObject);
                expect(callback).not.toHaveBeenCalled();
            });

        });
    }
);
