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
    ["../src/PolicyViewDecorator"],
    function (PolicyViewDecorator) {

        describe("The policy view decorator", function () {
            var mockPolicyService,
                mockViewService,
                mockDomainObject,
                testViews,
                decorator;

            beforeEach(function () {
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                mockViewService = jasmine.createSpyObj(
                    'viewService',
                    ['getViews']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId']
                );

                // Content of actions should be irrelevant to this
                // decorator, so just give it some objects to pass
                // around.
                testViews = [
                    { someKey: "a" },
                    { someKey: "b" },
                    { someKey: "c" }
                ];

                mockDomainObject.getId.and.returnValue('xyz');
                mockViewService.getViews.and.returnValue(testViews);
                mockPolicyService.allow.and.returnValue(true);

                decorator = new PolicyViewDecorator(
                    mockPolicyService,
                    mockViewService
                );
            });

            it("delegates to its decorated view service", function () {
                decorator.getViews(mockDomainObject);
                expect(mockViewService.getViews)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("provides views from its decorated view service", function () {
                // Mock policy service allows everything by default,
                // so everything should be returned
                expect(decorator.getViews(mockDomainObject))
                    .toEqual(testViews);
            });

            it("consults the policy service for each candidate view", function () {
                decorator.getViews(mockDomainObject);
                testViews.forEach(function (testView) {
                    expect(mockPolicyService.allow).toHaveBeenCalledWith(
                        'view',
                        testView,
                        mockDomainObject
                    );
                });
            });

            it("filters out policy-disallowed views", function () {
                // Disallow the second action
                mockPolicyService.allow.and.callFake(function (cat, candidate) {
                    return candidate.someKey !== 'b';
                });
                expect(decorator.getViews(mockDomainObject))
                    .toEqual([testViews[0], testViews[2]]);
            });

        });
    }
);
