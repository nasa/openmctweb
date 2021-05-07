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
    ['./Transaction', './NestedTransaction'],
    function (Transaction, NestedTransaction) {
        /**
         * Implements an application-wide transaction state. Once a
         * transaction is started, calls to
         * [PersistenceCapability.persist()]{@link PersistenceCapability#persist}
         * will be deferred until a subsequent call to
         * [TransactionService.commit]{@link TransactionService#commit} is made.
         *
         * @memberof platform/commonUI/edit/services
         * @param $q
         * @constructor
         */
        function TransactionService($q, $log, cacheService) {
            this.$q = $q;
            this.$log = $log;
            this.cacheService = cacheService;
            this.transactions = [];
        }

        /**
         * Starts a transaction. While a transaction is active all calls to
         * [PersistenceCapability.persist](@link PersistenceCapability#persist)
         * will be queued until [commit]{@link #commit} or [cancel]{@link
         * #cancel} are called
         */
        TransactionService.prototype.startTransaction = function () {
            var transaction = this.isActive()
                ? new NestedTransaction(this.transactions[0])
                : new Transaction(this.$log);

            this.transactions.push(transaction);
        };

        /**
         * @returns {boolean} If true, indicates that a transaction is in progress
         */
        TransactionService.prototype.isActive = function () {
            return this.transactions.length > 0;
        };

        /**
         * Adds provided functions to a queue to be called on
         * [.commit()]{@link #commit} or
         * [.cancel()]{@link #commit}
         * @param onCommit A function to call on commit
         * @param onCancel A function to call on cancel
         */
        TransactionService.prototype.addToTransaction = function (onCommit, onCancel) {
            if (this.isActive()) {
                return this.activeTransaction().add(onCommit, onCancel);
            } else {
                //Log error because this is a programming error if it occurs.
                this.$log.error("No transaction in progress");
            }
        };

        /**
         * Get the transaction at the top of the stack.
         * @private
         */
        TransactionService.prototype.activeTransaction = function () {
            return this.transactions[this.transactions.length - 1];
        };

        /**
         * All persist calls deferred since the beginning of the transaction
         * will be committed.  If this is the last transaction, clears the
         * cache.
         *
         * @returns {Promise} resolved when all persist operations have
         * completed. Will reject if any commit operations fail
         */
        TransactionService.prototype.commit = function () {
            var transaction = this.transactions.pop();
            if (!transaction) {
                return Promise.reject();
            }

            if (!this.isActive()) {
                return transaction.commit()
                    .then(function (r) {
                        this.cacheService.flush();

                        return r;
                    }.bind(this));
            }

            return transaction.commit();
        };

        /**
         * Cancel the current transaction, replacing any dirty objects from
         * persistence. Not a true rollback, as it cannot be used to undo any
         * persist calls that were successful in the event one of a batch of
         * persists failing.
         *
         * @returns {*}
         */
        TransactionService.prototype.cancel = function () {
            var transaction = this.transactions.pop();

            return transaction ? transaction.cancel() : Promise.reject();
        };

        /**
         * Get the size (the number of commit/cancel callbacks) of
         * the active transaction.
         * @returns {number} size of the active transaction
         */
        TransactionService.prototype.size = function () {
            return this.isActive() ? this.activeTransaction().size() : 0;
        };

        return TransactionService;
    });
