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
    ["../../src/services/TransactionService"],
    function (TransactionService) {

        describe("The Transaction Service", function () {
            var mockQ,
                mockLog,
                mockCacheService,
                transactionService;

            function fastPromise(val) {
                return {
                    then: function (callback) {
                        return fastPromise(callback(val));
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["all"]);
                mockCacheService = jasmine.createSpyObj("cacheService", ["flush"]);
                mockQ.all.and.returnValue(fastPromise());
                mockLog = jasmine.createSpyObj("$log", ["error"]);
                transactionService = new TransactionService(mockQ, mockLog, mockCacheService);
            });

            it("isActive returns true if a transaction is in progress", function () {
                expect(transactionService.isActive()).toBe(false);
                transactionService.startTransaction();
                expect(transactionService.isActive()).toBe(true);
            });

            it("addToTransaction queues onCommit and onCancel functions", function () {
                var onCommit = jasmine.createSpy('onCommit'),
                    onCancel = jasmine.createSpy('onCancel');

                transactionService.startTransaction();
                transactionService.addToTransaction(onCommit, onCancel);
                expect(transactionService.size()).toBe(1);
            });

            it("size function returns size of commit and cancel queues", function () {
                var onCommit = jasmine.createSpy('onCommit'),
                    onCancel = jasmine.createSpy('onCancel');

                transactionService.startTransaction();
                transactionService.addToTransaction(onCommit, onCancel);
                transactionService.addToTransaction(onCommit, onCancel);
                transactionService.addToTransaction(onCommit, onCancel);
                expect(transactionService.size()).toBe(3);
            });

            describe("commit", function () {
                var onCommits;

                beforeEach(function () {
                    onCommits = [0, 1, 2].map(function (val) {
                        return jasmine.createSpy("onCommit" + val);
                    });

                    transactionService.startTransaction();
                    onCommits.forEach(transactionService.addToTransaction.bind(transactionService));
                });

                it("commit calls all queued commit functions", function () {
                    expect(transactionService.size()).toBe(3);

                    return transactionService.commit().then(() => {
                        onCommits.forEach(function (spy) {
                            expect(spy).toHaveBeenCalled();
                        });
                    });
                });

                it("commit resets active state and clears queues", function () {
                    return transactionService.commit().then(() => {
                        expect(transactionService.isActive()).toBe(false);
                        expect(transactionService.size()).toBe(0);
                        expect(transactionService.size()).toBe(0);
                    });
                });

            });

            describe("cancel", function () {
                var onCancels;

                beforeEach(function () {
                    onCancels = [0, 1, 2].map(function (val) {
                        return jasmine.createSpy("onCancel" + val);
                    });

                    transactionService.startTransaction();
                    onCancels.forEach(function (onCancel) {
                        transactionService.addToTransaction(undefined, onCancel);
                    });
                });

                it("cancel calls all queued cancel functions", function () {
                    expect(transactionService.size()).toBe(3);
                    transactionService.cancel();
                    onCancels.forEach(function (spy) {
                        expect(spy).toHaveBeenCalled();
                    });
                });

                it("cancel resets active state and clears queues", function () {
                    transactionService.cancel();
                    expect(transactionService.isActive()).toBe(false);
                    expect(transactionService.size()).toBe(0);
                });

            });

        });
    }
);
