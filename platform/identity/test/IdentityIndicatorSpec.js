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
    ["../src/IdentityIndicator"],
    function (IdentityIndicator) {

        describe("The identity indicator", function () {
            var mockPromise,
                mockIdentityService,
                indicator;

            beforeEach(function () {
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockIdentityService = jasmine.createSpyObj(
                    'identityService',
                    ['getUser']
                );

                mockIdentityService.getUser.and.returnValue(mockPromise);

                indicator = new IdentityIndicator(mockIdentityService);
            });

            it("shows information about the current user", function () {
                mockPromise.then.calls.mostRecent().args[0]({
                    key: "testuserid",
                    name: "A User"
                });
                expect(indicator.getCssClass()).toEqual("icon-person");
                expect(indicator.getText()).toEqual("A User");
                expect(indicator.getDescription().indexOf("testuserid"))
                    .not.toEqual(-1);
            });

            it("shows nothing while no user information is available", function () {
                expect(indicator.getCssClass()).toBeUndefined();
                expect(indicator.getText()).toBeUndefined();
                expect(indicator.getDescription()).toBeUndefined();
            });

            it("shows nothing when there is no identity information", function () {
                mockPromise.then.calls.mostRecent().args[0](undefined);
                expect(indicator.getCssClass()).toBeUndefined();
                expect(indicator.getText()).toBeUndefined();
                expect(indicator.getDescription()).toBeUndefined();
            });

        });
    }
);
