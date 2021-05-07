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
    ["../src/PolicyProvider"],
    function (PolicyProvider) {

        describe("The policy provider", function () {
            var testPolicies,
                mockPolicies,
                mockPolicyConstructors,
                testCandidate,
                testContext,
                provider;

            beforeEach(function () {
                testPolicies = [
                    {
                        category: "a",
                        message: "some message",
                        result: true
                    },
                    {
                        category: "a",
                        result: true
                    },
                    {
                        category: "a",
                        result: true
                    },
                    {
                        category: "b",
                        message: "some message",
                        result: true
                    },
                    {
                        category: "b",
                        result: true
                    },
                    {
                        category: "b",
                        result: true
                    }
                ];
                mockPolicies = testPolicies.map(function (p) {
                    var mockPolicy = jasmine.createSpyObj("policy", ['allow']);
                    mockPolicy.allow.and.callFake(function () {
                        return p.result;
                    });

                    return mockPolicy;
                });
                mockPolicyConstructors = testPolicies.map(function (p, i) {
                    var mockPolicyConstructor = jasmine.createSpy();
                    mockPolicyConstructor.and.returnValue(mockPolicies[i]);
                    mockPolicyConstructor.message = p.message;
                    mockPolicyConstructor.category = p.category;

                    return mockPolicyConstructor;
                });

                testCandidate = { someKey: "some value" };
                testContext = { someOtherKey: "some other value" };

                provider = new PolicyProvider(mockPolicyConstructors);
            });

            it("has an allow method", function () {
                expect(provider.allow).toEqual(jasmine.any(Function));
            });

            it("consults all relevant policies", function () {
                provider.allow("a", testCandidate, testContext);
                expect(mockPolicies[0].allow)
                    .toHaveBeenCalledWith(testCandidate, testContext);
                expect(mockPolicies[1].allow)
                    .toHaveBeenCalledWith(testCandidate, testContext);
                expect(mockPolicies[2].allow)
                    .toHaveBeenCalledWith(testCandidate, testContext);
                expect(mockPolicies[3].allow)
                    .not.toHaveBeenCalled();
                expect(mockPolicies[4].allow)
                    .not.toHaveBeenCalled();
                expect(mockPolicies[5].allow)
                    .not.toHaveBeenCalled();
            });

            it("allows what all policies allow", function () {
                expect(provider.allow("a", testCandidate, testContext))
                    .toBeTruthy();
            });

            it("disallows what any one policy disallows", function () {
                testPolicies[1].result = false;
                expect(provider.allow("a", testCandidate, testContext))
                    .toBeFalsy();
            });

            it("provides a message for policy failure, when available", function () {
                var mockCallback = jasmine.createSpy();
                testPolicies[0].result = false;
                expect(provider.allow("a", testCandidate, testContext, mockCallback))
                    .toBeFalsy();
                expect(mockCallback).toHaveBeenCalledWith(testPolicies[0].message);
            });

        });
    }
);
