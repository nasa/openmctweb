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
 * ViewProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/views/ViewProvider"],
    function (ViewProvider) {

        describe("The view provider", function () {
            var viewA = {
                    key: "a"
                },
                viewB = {
                    key: "b",
                    needs: ["someCapability"]
                },
                viewC = {
                    key: "c",
                    needs: ["someCapability"],
                    delegation: true
                },
                capabilities = {},
                delegates = {},
                delegation,
                mockDomainObject = {},
                mockLog,
                provider;

            beforeEach(function () {
                // Simulate the expected API
                mockDomainObject.hasCapability = function (c) {
                    return capabilities[c] !== undefined;
                };

                mockDomainObject.getCapability = function (c) {
                    return capabilities[c];
                };

                mockDomainObject.useCapability = function (c, v) {
                    return capabilities[c] && capabilities[c].invoke(v);
                };

                mockLog = jasmine.createSpyObj("$log", ["warn", "info", "debug"]);

                capabilities = {};
                delegates = {};

                delegation = {
                    doesDelegateCapability: function (c) {
                        return delegates[c] !== undefined;
                    }
                };

                provider = new ViewProvider([viewA, viewB, viewC], mockLog);
            });

            it("reports views provided as extensions", function () {
                capabilities.someCapability = true;
                expect(provider.getViews(mockDomainObject))
                    .toEqual([viewA, viewB, viewC]);
            });

            it("filters views by needed capabilities", function () {
                //capabilities.someCapability = true;
                expect(provider.getViews(mockDomainObject))
                    .toEqual([viewA]);
            });

            it("allows delegation of needed capabilities when specified", function () {
                //capabilities.someCapability = true;
                capabilities.delegation = delegation;
                delegates.someCapability = true;
                expect(provider.getViews(mockDomainObject))
                    .toEqual([viewA, viewC]);
            });

            it("warns if keys are omitted from views", function () {
                // Verify that initial construction issued no warning
                expect(mockLog.warn).not.toHaveBeenCalled();
                // Recreate with no keys; that view should be filtered out
                expect(
                    new ViewProvider(
                        [viewA, { some: "bad view" }],
                        mockLog
                    ).getViews(mockDomainObject)
                ).toEqual([viewA]);
                // We should have also received a warning, to support debugging
                expect(mockLog.warn).toHaveBeenCalledWith(jasmine.any(String));
            });

            it("restricts typed views to matching types", function () {
                var testType = "testType",
                    testView = {
                        key: "x",
                        type: testType
                    },
                    viewProvider = new ViewProvider([testView], mockLog);

                // Include a "type" capability
                capabilities.type = jasmine.createSpyObj(
                    "type",
                    ["instanceOf", "invoke", "getDefinition"]
                );
                capabilities.type.invoke.and.returnValue(capabilities.type);

                // Should be included when types match
                capabilities.type.instanceOf.and.returnValue(true);
                expect(viewProvider.getViews(mockDomainObject))
                    .toEqual([testView]);
                expect(capabilities.type.instanceOf)
                    .toHaveBeenCalledWith(testType);

                // ...but not when they don't
                capabilities.type.instanceOf.and.returnValue(false);
                expect(viewProvider.getViews(mockDomainObject))
                    .toEqual([]);

            });

            it("enforces view restrictions from types", function () {
                var testView = { key: "x" },
                    viewProvider = new ViewProvider([testView], mockLog);

                // Include a "type" capability
                capabilities.type = jasmine.createSpyObj(
                    "type",
                    ["instanceOf", "invoke", "getDefinition"]
                );
                capabilities.type.invoke.and.returnValue(capabilities.type);

                // Should be included when view keys match
                capabilities.type.getDefinition
                    .and.returnValue({ views: [testView.key]});
                expect(viewProvider.getViews(mockDomainObject))
                    .toEqual([testView]);

                // ...but not when they don't
                capabilities.type.getDefinition
                    .and.returnValue({ views: ["somethingElse"]});
                expect(viewProvider.getViews(mockDomainObject))
                    .toEqual([]);
            });

        });
    }
);
