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
 * ModelAggregatorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/models/ModelAggregator"],
    function (ModelAggregator) {

        describe("The model aggregator", function () {
            var mockQ,
                mockProviders,
                modelList = [
                    {
                        "a": { someKey: "some value" },
                        "b": undefined
                    },
                    {
                        "b": { someOtherKey: "some other value" },
                        "a": undefined
                    }
                ],
                aggregator;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["all"]);
                mockProviders = modelList.map(function (models, i) {
                    var mockProvider = jasmine.createSpyObj(
                        "mockProvider" + i,
                        ["getModels"]
                    );
                    mockProvider.getModels.and.returnValue(models);

                    return mockProvider;
                });

                mockQ.all.and.returnValue({
                    then: function (c) {
                        return c(modelList);
                    }
                });

                aggregator = new ModelAggregator(mockQ, mockProviders);
            });

            it("aggregates results promised by multiple providers", function () {
                expect(aggregator.getModels(["a", "b"])).toEqual({
                    "a": { someKey: "some value" },
                    "b": { someOtherKey: "some other value" }
                });
            });

            it("passes ids to all aggregated providers", function () {
                aggregator.getModels(["a", "b"]);

                mockProviders.forEach(function (mockProvider) {
                    expect(mockProvider.getModels)
                        .toHaveBeenCalledWith(["a", "b"]);
                });
            });

        });
    }
);
