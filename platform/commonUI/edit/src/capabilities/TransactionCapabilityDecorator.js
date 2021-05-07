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
    ['./TransactionalPersistenceCapability'],
    function (TransactionalPersistenceCapability) {

        /**
         * Wraps the [PersistenceCapability]{@link PersistenceCapability} with
         * transactional capabilities.
         * @param $q
         * @param transactionService
         * @param capabilityService
         * @see TransactionalPersistenceCapability
         * @constructor
         */
        function TransactionCapabilityDecorator(
            $q,
            transactionService,
            capabilityService
        ) {
            this.capabilityService = capabilityService;
            this.transactionService = transactionService;
            this.$q = $q;
        }

        /**
         * Decorate PersistenceCapability to queue persistence calls when a
         * transaction is in progress.
         */
        TransactionCapabilityDecorator.prototype.getCapabilities = function () {
            var self = this,
                capabilities = this.capabilityService.getCapabilities
                    .apply(this.capabilityService, arguments),
                persistenceCapability = capabilities.persistence;

            capabilities.persistence = function (domainObject) {
                var original =
                    (typeof persistenceCapability === 'function')
                        ? persistenceCapability(domainObject)
                        : persistenceCapability;

                return new TransactionalPersistenceCapability(
                    self.$q,
                    self.transactionService,
                    original,
                    domainObject
                );
            };

            return capabilities;
        };

        return TransactionCapabilityDecorator;
    }
);
