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
 * PersistedModelProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/models/PersistedModelProvider"],
    function (PersistedModelProvider) {

        describe("The persisted model provider", function () {
            var mockQ,
                mockPersistenceService,
                SPACE = "space0",
                modTimes,
                mockNow,
                provider;

            function mockPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    },
                    testValue: value
                };
            }

            function mockAll(mockPromises) {
                return mockPromise(mockPromises.map(function (p) {
                    return p.testValue;
                }));
            }

            beforeEach(function () {
                modTimes = {};
                mockQ = {
                    when: mockPromise,
                    all: mockAll
                };
                mockPersistenceService = jasmine.createSpyObj(
                    'persistenceService',
                    [
                        'createObject',
                        'readObject',
                        'updateObject',
                        'deleteObject',
                        'listSpaces',
                        'listObjects'
                    ]
                );
                mockNow = jasmine.createSpy("now");

                mockPersistenceService.readObject
                    .and.callFake(function (space, id) {
                        return mockPromise({
                            space: space,
                            id: id,
                            modified: (modTimes[space] || {})[id],
                            persisted: 0
                        });
                    });
                mockPersistenceService.listSpaces
                    .and.returnValue(mockPromise([SPACE]));

                provider = new PersistedModelProvider(
                    mockPersistenceService,
                    mockQ,
                    mockNow,
                    SPACE
                );
            });

            it("reads object models from persistence", function () {
                var models;

                provider.getModels(["a", "x", "zz"]).then(function (m) {
                    models = m;
                });

                expect(models).toEqual({
                    a: {
                        space: SPACE,
                        id: "a",
                        persisted: 0,
                        modified: undefined
                    },
                    x: {
                        space: SPACE,
                        id: "x",
                        persisted: 0,
                        modified: undefined
                    },
                    zz: {
                        space: SPACE,
                        id: "zz",
                        persisted: 0,
                        modified: undefined
                    }
                });
            });

            it("ensures that persisted timestamps are present", function () {
                var mockCallback = jasmine.createSpy("callback"),
                    testModels = {
                        a: {
                            modified: 123,
                            persisted: 1984,
                            name: "A"
                        },
                        b: {
                            persisted: 1977,
                            name: "B"
                        },
                        c: {
                            modified: 42,
                            name: "C"
                        },
                        d: { name: "D" }
                    };

                mockPersistenceService.readObject.and.callFake(
                    function (space, id) {
                        return mockPromise(testModels[id]);
                    }
                );
                mockNow.and.returnValue(12321);

                provider.getModels(Object.keys(testModels)).then(mockCallback);

                expect(mockCallback).toHaveBeenCalledWith({
                    a: {
                        modified: 123,
                        persisted: 1984,
                        name: "A"
                    },
                    b: {
                        persisted: 1977,
                        name: "B"
                    },
                    c: {
                        modified: 42,
                        persisted: 42,
                        name: "C"
                    },
                    d: {
                        persisted: 12321,
                        name: "D"
                    }
                });
            });

        });
    }
);
