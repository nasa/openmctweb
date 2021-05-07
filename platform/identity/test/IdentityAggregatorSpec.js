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
    ["../src/IdentityAggregator"],
    function (IdentityAggregator) {

        describe("The identity aggregator", function () {
            var mockProviders,
                mockQ,
                resolves,
                testUsers,
                aggregator;

            function resolveProviderPromises() {
                ['a', 'b', 'c'].forEach(function (id, i) {
                    resolves[id](testUsers[i]);
                });
            }

            beforeEach(function () {
                testUsers = [
                    {
                        key: "user0",
                        name: "User Zero"
                    },
                    {
                        key: "user1",
                        name: "User One"
                    },
                    {
                        key: "user2",
                        name: "User Two"
                    }
                ];

                resolves = {};

                mockProviders = ['a', 'b', 'c'].map(function (id) {
                    var mockProvider = jasmine.createSpyObj(
                        'provider-' + id,
                        ['getUser']
                    );

                    mockProvider.getUser.and.returnValue(new Promise(function (r) {
                        resolves[id] = r;
                    }));

                    return mockProvider;
                });

                mockQ = jasmine.createSpyObj('$q', ['all']);
                mockQ.all.and.callFake(function (promises) {
                    return Promise.all(promises);
                });

                aggregator = new IdentityAggregator(
                    mockQ,
                    mockProviders
                );
            });

            it("delegates to the aggregated providers", function () {
                // Verify precondition
                mockProviders.forEach(function (p) {
                    expect(p.getUser).not.toHaveBeenCalled();
                });

                aggregator.getUser();

                mockProviders.forEach(function (p) {
                    expect(p.getUser).toHaveBeenCalled();
                });
            });

            it("returns the first result when it is defined", function () {
                var promise = aggregator.getUser();

                resolveProviderPromises();

                return promise.then(function (user) {
                    expect(user).toEqual(testUsers[0]);
                });
            });

            it("returns a later result when earlier results are undefined", function () {
                testUsers[0] = undefined;

                var promise = aggregator.getUser();

                resolveProviderPromises();

                return promise.then(function (user) {
                    expect(user).toEqual(testUsers[1]);
                });
            });

            it("returns undefined when no providers expose users", function () {
                testUsers = [undefined, undefined, undefined];

                var promise = aggregator.getUser();

                resolveProviderPromises();

                return promise.then(function (user) {
                    expect(user).toBe(undefined);
                });
            });

            it("returns undefined when there are no providers", function () {
                var promise = new IdentityAggregator(mockQ, []).getUser();

                return promise.then(function (user) {
                    expect(user).toBe(undefined);
                });
            });

        });
    }
);
