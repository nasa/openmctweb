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
 * StaticModelProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/models/StaticModelProvider"],
    function (StaticModelProvider) {

        describe("The static model provider", function () {
            var models = [
                    {
                        "id": "a",
                        "model": {
                            "name": "Thing A",
                            "someProperty": "Some Value A"
                        }
                    },
                    {
                        "id": "b",
                        "model": {
                            "name": "Thing B",
                            "someProperty": "Some Value B"
                        }
                    }
                ],
                mockLog,
                mockQ,
                provider;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["when"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                provider = new StaticModelProvider(models, mockQ, mockLog);
            });

            it("provides models from extension declarations", function () {
                var mockPromise = {
                    then: function () {
                        return;
                    }
                };
                mockQ.when.and.returnValue(mockPromise);

                // Verify that we got the promise as the return value
                expect(provider.getModels(["a", "b"])).toEqual(mockPromise);

                // Verify that the promise has the desired models
                expect(mockQ.when.calls.count()).toEqual(1);
                expect(mockQ.when.calls.mostRecent().args[0].a.name).toEqual("Thing A");
                expect(mockQ.when.calls.mostRecent().args[0].a.someProperty).toEqual("Some Value A");
                expect(mockQ.when.calls.mostRecent().args[0].b.name).toEqual("Thing B");
                expect(mockQ.when.calls.mostRecent().args[0].b.someProperty).toEqual("Some Value B");
            });

            it("does not provide models which are not in extension declarations", function () {
                provider.getModels(["c"]);

                // Verify that the promise has the desired models
                expect(mockQ.when.calls.count()).toEqual(1);
                expect(mockQ.when.calls.mostRecent().args[0].c).toBeUndefined();
            });

            it("logs a warning when model definitions are malformed", function () {
                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Shouldn't fail with an exception
                expect(new StaticModelProvider([
                    { "bad": "no id" },
                    { "id": "...but no model..." },
                    { "model": "...and no id..." },
                    {
                        "id": -40,
                        "model": {}
                    },
                    {
                        "model": "should be an object",
                        "id": "x"
                    }
                ], mockQ, mockLog)).toBeDefined();

                // Should show warnings
                expect(mockLog.warn.calls.count()).toEqual(5);
            });

        });
    }
);
