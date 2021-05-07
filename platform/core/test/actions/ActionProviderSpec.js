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
 * ActionProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/actions/ActionProvider"],
    function (ActionProvider) {

        describe("The action provider", function () {
            var mockLog,
                actions,
                actionProvider;

            function SimpleAction() {
                return {
                    perform: function () {
                        return "simple";
                    }
                };
            }

            function CategorizedAction() {
                return {
                    perform: function () {
                        return "categorized";
                    }
                };
            }

            CategorizedAction.category = "someCategory";

            function KeyedAction() {
                return {
                    perform: function () {
                        return "keyed";
                    }
                };
            }

            KeyedAction.key = "someKey";

            function CategorizedKeyedAction() {
                return {
                    perform: function () {
                        return "both";
                    }
                };
            }

            CategorizedKeyedAction.key = "someKey";
            CategorizedKeyedAction.category = "someCategory";

            function MetadataAction() {
                return {
                    perform: function () {
                        return "metadata";
                    },
                    getMetadata: function () {
                        return "custom metadata";
                    }
                };
            }

            MetadataAction.key = "metadata";

            beforeEach(function () {
                mockLog = jasmine.createSpyObj(
                    '$log',
                    ['error', 'warn', 'info', 'debug']
                );
                actions = [
                    SimpleAction,
                    CategorizedAction,
                    KeyedAction,
                    CategorizedKeyedAction,
                    MetadataAction
                ];
                actionProvider = new ActionProvider(actions);
            });

            it("exposes provided action extensions", function () {
                var provided = actionProvider.getActions();

                // Should have gotten all actions
                expect(provided.length).toEqual(actions.length);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("simple");
            });

            it("matches provided actions by key", function () {
                var provided = actionProvider.getActions({ key: "someKey" });

                // Only two should have matched
                expect(provided.length).toEqual(2);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("keyed");
            });

            it("matches provided actions by category", function () {
                var provided = actionProvider.getActions({ category: "someCategory" });

                // Only two should have matched
                expect(provided.length).toEqual(2);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("categorized");
            });

            it("matches provided actions by both category and key", function () {
                var provided = actionProvider.getActions({
                    category: "someCategory",
                    key: "someKey"
                });

                // Only two should have matched
                expect(provided.length).toEqual(1);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("both");
            });

            it("adds a getMetadata method when none is defined", function () {
                var provided = actionProvider.getActions({
                    category: "someCategory",
                    key: "someKey"
                });

                // Should be defined, even though the action didn't define this
                expect(provided[0].getMetadata).toBeDefined();

                // Should have static fields, plus context
                expect(provided[0].getMetadata().context).toEqual({
                    key: "someKey",
                    category: "someCategory"
                });

            });

            it("does not override defined getMetadata methods", function () {
                var provided = actionProvider.getActions({ key: "metadata" });
                expect(provided[0].getMetadata()).toEqual("custom metadata");
            });

            describe("when actions throw errors during instantiation", function () {
                var errorText,
                    provided;

                beforeEach(function () {
                    errorText = "some error text";

                    function BadAction() {
                        throw new Error(errorText);
                    }

                    provided = new ActionProvider(
                        [SimpleAction, BadAction],
                        mockLog
                    ).getActions();
                });

                it("logs an error", function () {
                    expect(mockLog.error)
                        .toHaveBeenCalledWith(jasmine.any(String));
                });

                it("reports the error's message", function () {
                    expect(
                        mockLog.error.calls.mostRecent().args[0].indexOf(errorText)
                    ).not.toEqual(-1);
                });

                it("still provides valid actions", function () {
                    expect(provided.length).toEqual(1);
                    expect(provided[0].perform()).toEqual("simple");
                });

            });

        });
    }
);
