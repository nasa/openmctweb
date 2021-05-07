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
    ["../../src/runs/TransactingMutationListener"],
    function (TransactingMutationListener) {

        describe("TransactingMutationListener", function () {
            var mockTopic,
                mockMutationTopic,
                mockCacheService,
                mockTransactionService,
                mockDomainObject,
                mockModel,
                mockPersistence;

            beforeEach(function () {
                mockTopic = jasmine.createSpy('topic');
                mockMutationTopic =
                    jasmine.createSpyObj('mutation', ['listen']);
                mockCacheService =
                    jasmine.createSpyObj('cacheService', [
                        'put'
                    ]);
                mockTransactionService =
                    jasmine.createSpyObj('transactionService', [
                        'isActive',
                        'startTransaction',
                        'commit'
                    ]);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability', 'getModel']
                );
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist', 'refresh', 'persisted']
                );

                mockTopic.and.callFake(function (t) {
                    expect(t).toBe('mutation');

                    return mockMutationTopic;
                });

                mockDomainObject.getId.and.returnValue('mockId');
                mockDomainObject.getCapability.and.callFake(function (c) {
                    expect(c).toBe('persistence');

                    return mockPersistence;
                });
                mockModel = {};
                mockDomainObject.getModel.and.returnValue(mockModel);

                mockPersistence.persisted.and.returnValue(true);

                return new TransactingMutationListener(
                    mockTopic,
                    mockTransactionService,
                    mockCacheService
                );
            });

            it("listens for mutation", function () {
                expect(mockMutationTopic.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("calls persist if the model has changed", function () {
                mockModel.persisted = Date.now();

                //Mark the model dirty by setting the mutated date later than the last persisted date.
                mockModel.modified = mockModel.persisted + 1;

                mockMutationTopic.listen.calls.mostRecent()
                    .args[0](mockDomainObject);

                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("does not call persist if the model has not changed", function () {
                mockModel.persisted = Date.now();

                mockModel.modified = mockModel.persisted;

                mockMutationTopic.listen.calls.mostRecent()
                    .args[0](mockDomainObject);

                expect(mockPersistence.persist).not.toHaveBeenCalled();
            });
        });
    }
);
