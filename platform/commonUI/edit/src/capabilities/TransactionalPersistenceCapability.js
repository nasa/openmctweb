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
    [],
    function () {

        /**
         * Wraps persistence capability to enable transactions. Transactions
         * will cause persist calls not to be invoked immediately, but
         * rather queued until [EditorCapability.save()]{@link EditorCapability#save}
         * or [EditorCapability.cancel()]{@link EditorCapability#cancel} are
         * called.
         * @memberof platform/commonUI/edit/capabilities
         * @param $q
         * @param transactionManager
         * @param persistenceCapability
         * @param domainObject
         * @constructor
         */
        function TransactionalPersistenceCapability(
            $q,
            transactionManager,
            persistenceCapability,
            domainObject
        ) {
            this.transactionManager = transactionManager;
            this.persistenceCapability = persistenceCapability;
            this.domainObject = domainObject;
            this.$q = $q;
        }

        /**
         * The wrapped persist function. If a transaction is active, persist
         * will be queued until the transaction is committed or cancelled.
         * @returns {*}
         */
        TransactionalPersistenceCapability.prototype.persist = function () {
            var wrappedPersistence = this.persistenceCapability;

            if (this.transactionManager.isActive()) {
                this.transactionManager.addToTransaction(
                    this.domainObject.getId(),
                    wrappedPersistence.persist.bind(wrappedPersistence),
                    wrappedPersistence.refresh.bind(wrappedPersistence)
                );

                //Need to return a promise from this function
                return this.$q.when(true);
            } else {
                return this.persistenceCapability.persist();
            }
        };

        TransactionalPersistenceCapability.prototype.refresh = function () {
            this.transactionManager
                .clearTransactionsFor(this.domainObject.getId());

            return this.persistenceCapability.refresh();
        };

        TransactionalPersistenceCapability.prototype.getSpace = function () {
            return this.persistenceCapability.getSpace();
        };

        TransactionalPersistenceCapability.prototype.persisted = function () {
            return this.persistenceCapability.persisted();
        };

        return TransactionalPersistenceCapability;
    }
);
