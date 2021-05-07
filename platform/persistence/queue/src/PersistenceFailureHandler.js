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
    ['./PersistenceFailureDialog', './PersistenceFailureConstants'],
    function (PersistenceFailureDialog, PersistenceFailureConstants) {

        /**
         * Handle failures to persist domain object models.
         * @param $q Angular's `$q`
         * @param {DialogService} dialogService the dialog service
         * @constructor
         * @memberof platform/persistence/queue
         */
        function PersistenceFailureHandler($q, dialogService) {
            this.$q = $q;
            this.dialogService = dialogService;
        }

        /**
         * Discard failures
         * @param {Array} failures persistence failures, as prepared
         *        by PersistenceQueueHandler
         * @memberof platform/persistence/queue.PersistenceFailureHandler#
         */
        PersistenceFailureHandler.prototype.handle = function handleFailures(failures) {

            var dialogModel = new PersistenceFailureDialog(failures),
                revisionErrors = dialogModel.model.revised,
                $q = this.$q;

            // Discard changes for a failed refresh
            function discard(failure) {
                var persistence =
                    failure.domainObject.getCapability('persistence');

                return persistence.refresh();
            }

            // Discard changes associated with a failed save
            function discardAll(failuresToDiscard) {
                return $q.all(failuresToDiscard.map(discard));
            }

            return discardAll(revisionErrors);
        };

        return PersistenceFailureHandler;
    }
);
