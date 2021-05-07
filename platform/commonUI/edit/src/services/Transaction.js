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
     * A Transaction represents a set of changes that are intended to
     * be kept or discarded as a unit.
     * @param $log Angular's `$log` service, for logging messages
     * @constructor
     * @memberof platform/commonUI/edit/services
     */
    function Transaction($log) {
        this.$log = $log;
        this.callbacks = [];
    }

    /**
     * Add a change to the current transaction, as expressed by functions
     * to either keep or discard the change.
     * @param {Function} commit called when the transaction is committed
     * @param {Function} cancel called when the transaction is cancelled
     * @returns {Function) a function which may be called to remove this
     *          pair of callbacks from the transaction
     */
    Transaction.prototype.add = function (commit, cancel) {
        var callback = {
            commit: commit,
            cancel: cancel
        };
        this.callbacks.push(callback);

        return function () {
            this.callbacks = this.callbacks.filter(function (c) {
                return c !== callback;
            });
        }.bind(this);
    };

    /**
     * Get the number of changes in the current transaction.
     * @returns {number} the size of the current transaction
     */
    Transaction.prototype.size = function () {
        return this.callbacks.length;
    };

    /**
     * Keep all changes associated with this transaction.
     * @method {platform/commonUI/edit/services.Transaction#commit}
     * @returns {Promise} a promise which will resolve when all callbacks
     *          have been handled.
     */

    /**
     * Discard all changes associated with this transaction.
     * @method {platform/commonUI/edit/services.Transaction#cancel}
     * @returns {Promise} a promise which will resolve when all callbacks
     *          have been handled.
     */

    ['commit', 'cancel'].forEach(function (method) {
        Transaction.prototype[method] = function () {
            var promises = [];
            var callback;

            while (this.callbacks.length > 0) {
                callback = this.callbacks.shift();
                try {
                    promises.push(callback[method]());
                } catch (e) {
                    this.$log
                        .error("Error trying to " + method + " transaction.");
                }
            }

            return Promise.all(promises);
        };
    });

    return Transaction;
});
