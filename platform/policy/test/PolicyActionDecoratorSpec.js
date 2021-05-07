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
    ["../src/PolicyActionDecorator"],
    function (PolicyActionDecorator) {

        describe("The policy action decorator", function () {
            var mockPolicyService,
                mockActionService,
                testContext,
                testActions,
                decorator;

            beforeEach(function () {
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                mockActionService = jasmine.createSpyObj(
                    'actionService',
                    ['getActions']
                );

                // Content of actions should be irrelevant to this
                // decorator, so just give it some objects to pass
                // around.
                testActions = [
                    { someKey: "a" },
                    { someKey: "b" },
                    { someKey: "c" }
                ];
                testContext = { someKey: "some value" };

                mockActionService.getActions.and.returnValue(testActions);
                mockPolicyService.allow.and.returnValue(true);

                decorator = new PolicyActionDecorator(
                    mockPolicyService,
                    mockActionService
                );
            });

            it("delegates to its decorated action service", function () {
                decorator.getActions(testContext);
                expect(mockActionService.getActions)
                    .toHaveBeenCalledWith(testContext);
            });

            it("provides actions from its decorated action service", function () {
                // Mock policy service allows everything by default,
                // so everything should be returned
                expect(decorator.getActions(testContext))
                    .toEqual(testActions);
            });

            it("consults the policy service for each candidate action", function () {
                decorator.getActions(testContext);
                testActions.forEach(function (testAction) {
                    expect(mockPolicyService.allow).toHaveBeenCalledWith(
                        'action',
                        testAction,
                        testContext
                    );
                });
            });

            it("filters out policy-disallowed actions", function () {
                // Disallow the second action
                mockPolicyService.allow.and.callFake(function (cat, candidate) {
                    return candidate.someKey !== 'b';
                });
                expect(decorator.getActions(testContext))
                    .toEqual([testActions[0], testActions[2]]);
            });

        });
    }
);
