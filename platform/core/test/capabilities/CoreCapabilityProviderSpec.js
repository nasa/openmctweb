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
 * CoreCapabilityProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/CoreCapabilityProvider"],
    function (CoreCapabilityProvider) {

        describe("The core capability provider", function () {
            var mockLog,
                provider;

            function BasicCapability() {
                return;
            }

            BasicCapability.key = "basic";

            function ApplicableCapability() {
                return;
            }

            ApplicableCapability.key = "applicable";
            ApplicableCapability.appliesTo = function (model) {
                return !model.isNotApplicable;
            };

            function KeylessCapability() {
                return;
            }

            beforeEach(function () {
                KeylessCapability.key = undefined;

                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );

                provider = new CoreCapabilityProvider([
                    BasicCapability,
                    ApplicableCapability,
                    KeylessCapability
                ], mockLog);
            });

            it("returns capabilities for models, from extensions", function () {
                expect(provider.getCapabilities({})).toEqual({
                    basic: BasicCapability,
                    applicable: ApplicableCapability
                });
            });

            it("filters out capabilities which do not apply to models", function () {
                expect(provider.getCapabilities({ isNotApplicable: true })).toEqual({
                    basic: BasicCapability
                });
            });

            it("logs a warning when capability extensions have not defined keys", function () {
                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                provider.getCapabilities({});

                expect(mockLog.warn).toHaveBeenCalled();

            });

            it("does not log a warning when all capability extensions are valid", function () {
                KeylessCapability.key = "someKey";
                provider.getCapabilities({});
                expect(mockLog.warn).not.toHaveBeenCalled();
            });

            it("prefers higher-priority capability", function () {
                KeylessCapability.key = BasicCapability.key;
                expect(provider.getCapabilities({}).basic)
                    .toEqual(BasicCapability);
            });

            // https://github.com/nasa/openmctweb/issues/49
            it("does not log a warning for multiple capabilities with the same key", function () {
                KeylessCapability.key = BasicCapability.key;
                provider.getCapabilities({});
                expect(mockLog.warn).not.toHaveBeenCalled();
            });

        });
    }
);
