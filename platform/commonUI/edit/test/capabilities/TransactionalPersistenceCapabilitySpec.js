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
    [
        "../../src/capabilities/TransactionalPersistenceCapability"
    ],
    function (TransactionalPersistenceCapability) {

        function fastPromise(val) {
            return {
                then: function (callback) {
                    return callback(val);
                }
            };
        }

        describe("The transactional persistence decorator", function () {
            var mockQ,
                mockTransactionManager,
                mockPersistence,
                mockDomainObject,
                testId,
                capability;

            beforeEach(function () {
                testId = "test-id";

                mockQ = jasmine.createSpyObj("$q", ["when"]);
                mockQ.when.and.callFake(function (val) {
                    return fastPromise(val);
                });
                mockTransactionManager = jasmine.createSpyObj(
                    "transactionService",
                    ["isActive", "addToTransaction", "clearTransactionsFor"]
                );
                mockPersistence = jasmine.createSpyObj(
                    "persistenceCapability",
                    ["persist", "refresh", "getSpace"]
                );
                mockPersistence.persist.and.returnValue(fastPromise());
                mockPersistence.refresh.and.returnValue(fastPromise());

                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getModel", "getId"]
                );
                mockDomainObject.getModel.and.returnValue({persisted: 1});
                mockDomainObject.getId.and.returnValue(testId);

                capability = new TransactionalPersistenceCapability(
                    mockQ,
                    mockTransactionManager,
                    mockPersistence,
                    mockDomainObject
                );
            });

            it("if no transaction is active, passes through to persistence"
                + " provider", function () {
                mockTransactionManager.isActive.and.returnValue(false);
                capability.persist();
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("if transaction is active, persist and cancel calls are"
                + " queued", function () {
                mockTransactionManager.isActive.and.returnValue(true);
                capability.persist();
                expect(mockTransactionManager.addToTransaction).toHaveBeenCalled();
                mockTransactionManager.addToTransaction.calls.mostRecent().args[1]();
                expect(mockPersistence.persist).toHaveBeenCalled();
                mockTransactionManager.addToTransaction.calls.mostRecent().args[2]();
                expect(mockPersistence.refresh).toHaveBeenCalled();
            });

            it("wraps getSpace", function () {
                mockPersistence.getSpace.and.returnValue('foo');
                expect(capability.getSpace()).toEqual('foo');
            });

            it("clears transactions and delegates refresh calls", function () {
                capability.refresh();
                expect(mockTransactionManager.clearTransactionsFor)
                    .toHaveBeenCalledWith(testId);
                expect(mockPersistence.refresh)
                    .toHaveBeenCalled();
            });

        });
    }
);
