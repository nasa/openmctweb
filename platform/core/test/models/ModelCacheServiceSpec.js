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

define(['../../src/models/ModelCacheService'], function (ModelCacheService) {
    describe("ModelCacheService", function () {
        var testIds,
            testModels,
            cacheService;

        beforeEach(function () {
            testIds = ['a', 'b', 'c', 'd'];
            testModels = testIds.reduce(function (models, id) {
                models[id] = { someKey: "some value for " + id };

                return models;
            }, {});
            cacheService = new ModelCacheService();
        });

        describe("when populated with models", function () {
            beforeEach(function () {
                testIds.forEach(function (id) {
                    cacheService.put(id, testModels[id]);
                });
            });

            it("indicates that it has these models", function () {
                testIds.forEach(function (id) {
                    expect(cacheService.has(id)).toBe(true);
                });
            });

            it("provides all of these models", function () {
                expect(cacheService.all()).toEqual(testModels);
            });

            it("allows models to be retrieved", function () {
                testIds.forEach(function (id) {
                    expect(cacheService.get(id)).toEqual(testModels[id]);
                });
            });

            it("allows models to be removed", function () {
                cacheService.remove('a');
                expect(cacheService.has('a')).toBe(false);
            });
        });
    });
});
