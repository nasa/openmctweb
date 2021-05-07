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

define([], function () {
    /**
     * Manages transactions to support the TransactionalPersistenceCapability.
     * This assumes that all commit/cancel callbacks for a given domain
     * object are equivalent, and only need to be added once to any active
     * transaction. Violating this assumption may cause unexpected behavior.
     * @constructor
     * @memberof platform/commonUI/edit
     */
    function TransactionManager(transactionService) {
        this.transactionService = transactionService;
        this.clearTransactionFns = {};
    }

    /**
     * Check if a transaction is currently active.
     * @returns {boolean} true if there is a transaction active
     */
    TransactionManager.prototype.isActive = function () {
        return this.transactionService.isActive();
    };

    /**
     * Check if callbacks associated with this domain object have already
     * been added to the active transaction.
     * @private
     * @param {string} id the identifier of the domain object to check
     * @returns {boolean} true if callbacks have been added
     */
    TransactionManager.prototype.isScheduled = function (id) {
        return Boolean(this.clearTransactionFns[id]);
    };

    /**
     * Add callbacks associated with this domain object to the active
     * transaction. Both callbacks are expected to return promises that
     * resolve when their associated behavior is complete.
     *
     * If callbacks associated with this domain object have already been
     * added to the active transaction, this call will be ignored.
     *
     * @param {string} id the identifier of the associated domain object
     * @param {Function} onCommit behavior to invoke when committing transaction
     * @param {Function} onCancel behavior to invoke when cancelling transaction
     */
    TransactionManager.prototype.addToTransaction = function (
        id,
        onCommit,
        onCancel
    ) {
        var release = this.releaseClearFn.bind(this, id);

        function chain(promiseFn, nextFn) {
            return function () {
                return promiseFn().then(nextFn);
            };
        }

        /**
         * Clear any existing persistence calls for object with given ID. This ensures only the most recent persistence
         * call is executed. This should prevent stale objects being persisted and overwriting fresh ones.
         */
        if (this.isScheduled(id)) {
            this.clearTransactionsFor(id);
        }

        this.clearTransactionFns[id] =
            this.transactionService.addToTransaction(
                chain(onCommit, release),
                chain(onCancel, release)
            );
    };

    /**
     * Remove any callbacks associated with this domain object from the
     * active transaction.
     * @param {string} id the identifier for the domain object
     */
    TransactionManager.prototype.clearTransactionsFor = function (id) {
        if (this.isScheduled(id)) {
            this.clearTransactionFns[id]();
            this.releaseClearFn(id);
        }
    };

    /**
     * Release the cached "remove from transaction" function that has been
     * stored in association with this domain object.
     * @param {string} id the identifier for the domain object
     * @private
     */
    TransactionManager.prototype.releaseClearFn = function (id) {
        delete this.clearTransactionFns[id];
    };

    return TransactionManager;
});
