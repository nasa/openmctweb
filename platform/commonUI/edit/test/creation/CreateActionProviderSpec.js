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
    ["../../src/creation/CreateActionProvider"],
    function (CreateActionProvider) {

        describe("The create action provider", function () {
            var mockTypeService,
                mockPolicyService,
                mockCreationPolicy,
                mockPolicyMap = {},
                mockTypes,
                provider;

            function createMockType(name) {
                var mockType = jasmine.createSpyObj(
                    "type" + name,
                    [
                        "getKey",
                        "getGlyph",
                        "getCssClass",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel",
                        "hasFeature"
                    ]
                );
                mockType.hasFeature.and.returnValue(true);
                mockType.getName.and.returnValue(name);

                return mockType;
            }

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    ["listTypes"]
                );
                mockPolicyService = jasmine.createSpyObj(
                    "policyService",
                    ["allow"]
                );

                mockTypes = ["A", "B", "C"].map(createMockType);

                mockTypes.forEach(function (type) {
                    mockPolicyMap[type.getName()] = true;
                });

                mockCreationPolicy = function (type) {
                    return mockPolicyMap[type.getName()];
                };

                mockPolicyService.allow.and.callFake(function (category, type) {
                    return Boolean(category === "creation" && mockCreationPolicy(type));
                });

                mockTypeService.listTypes.and.returnValue(mockTypes);

                provider = new CreateActionProvider(
                    mockTypeService,
                    mockPolicyService
                );
            });

            it("exposes one create action per type", function () {
                expect(provider.getActions({
                    key: "create",
                    domainObject: {}
                }).length).toEqual(3);
            });

            it("exposes no non-create actions", function () {
                expect(provider.getActions({
                    key: "somethingElse",
                    domainObject: {}
                }).length).toEqual(0);
            });

            it("does not expose non-creatable types", function () {
                // One of the types won't have the creation feature...
                mockPolicyMap[mockTypes[0].getName()] = false;
                // ...so it should have been filtered out.
                expect(provider.getActions({
                    key: "create",
                    domainObject: {}
                }).length).toEqual(2);
                // Make sure it was creation which was used to check
                expect(mockPolicyService.allow)
                    .toHaveBeenCalledWith("creation", mockTypes[0]);
            });
        });
    }
);
