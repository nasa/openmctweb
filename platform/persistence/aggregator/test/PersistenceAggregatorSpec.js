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
    ['../src/PersistenceAggregator'],
    function (PersistenceAggregator) {

        var PERSISTENCE_SERVICE_METHODS = [
                'listSpaces',
                'listObjects',
                'createObject',
                'readObject',
                'updateObject',
                'deleteObject'
            ],
            WRAPPED_METHODS = PERSISTENCE_SERVICE_METHODS.filter(function (m) {
                return m !== 'listSpaces';
            });

        function fakePromise(value) {
            return (value || {}).then ? value : {
                then: function (callback) {
                    return fakePromise(callback(value));
                }
            };
        }

        describe("PersistenceAggregator", function () {
            var mockQ,
                mockProviders,
                mockCallback,
                testSpaces,
                aggregator;

            beforeEach(function () {
                testSpaces = ['a', 'b', 'c'];
                mockQ = jasmine.createSpyObj("$q", ['all']);
                mockProviders = testSpaces.map(function (space) {
                    var mockProvider = jasmine.createSpyObj(
                        'provider-' + space,
                        PERSISTENCE_SERVICE_METHODS
                    );
                    PERSISTENCE_SERVICE_METHODS.forEach(function (m) {
                        mockProvider[m].and.returnValue(fakePromise(true));
                    });
                    mockProvider.listSpaces.and.returnValue(fakePromise([space]));

                    return mockProvider;
                });
                mockCallback = jasmine.createSpy();

                mockQ.all.and.callFake(function (fakePromises) {
                    var result = [];
                    fakePromises.forEach(function (p) {
                        p.then(function (v) {
                            result.push(v);
                        });
                    });

                    return fakePromise(result);
                });

                aggregator = new PersistenceAggregator(mockQ, mockProviders);
            });

            it("exposes spaces for all providers", function () {
                aggregator.listSpaces().then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith(testSpaces);
            });

            WRAPPED_METHODS.forEach(function (m) {
                it("redirects " + m + " calls to an appropriate provider", function () {
                    testSpaces.forEach(function (space, index) {
                        var key = 'key-' + space,
                            value = 'val-' + space;
                        expect(aggregator[m](space, key, value))
                            .toEqual(mockProviders[index][m]());
                        expect(mockProviders[index][m])
                            .toHaveBeenCalledWith(space, key, value);
                    });
                });
            });

        });
    }
);
