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
    ["../../src/models/MissingModelDecorator"],
    function (MissingModelDecorator) {

        describe("The missing model decorator", function () {
            var mockModelService,
                testModels,
                decorator;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockModelService = jasmine.createSpyObj(
                    "modelService",
                    ["getModels"]
                );

                testModels = {
                    testId: { someKey: "some value" }
                };

                mockModelService.getModels.and.returnValue(asPromise(testModels));

                decorator = new MissingModelDecorator(mockModelService);
            });

            it("delegates to the wrapped model service", function () {
                decorator.getModels(['a', 'b', 'c']);
                expect(mockModelService.getModels)
                    .toHaveBeenCalledWith(['a', 'b', 'c']);
            });

            it("provides models for any IDs which are missing", function () {
                var models;
                decorator.getModels(['testId', 'otherId'])
                    .then(function (m) {
                        models = m;
                    });
                expect(models.otherId).toBeDefined();
            });

            it("does not overwrite existing models", function () {
                var models;
                decorator.getModels(['testId', 'otherId'])
                    .then(function (m) {
                        models = m;
                    });
                expect(models.testId).toEqual({ someKey: "some value" });
            });

            it("does not modify the wrapped service's response", function () {
                decorator.getModels(['testId', 'otherId']);
                expect(testModels.otherId).toBeUndefined();
            });
        });

    }
);
