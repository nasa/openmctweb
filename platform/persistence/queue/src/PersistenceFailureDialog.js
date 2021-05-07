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
    ['./PersistenceFailureConstants'],
    function (PersistenceFailureConstants) {

        var OVERWRITE_CANCEL_OPTIONS = [
                {
                    name: "Overwrite",
                    key: PersistenceFailureConstants.OVERWRITE_KEY
                },
                {
                    name: "Discard",
                    key: "cancel"
                }
            ],
            OK_OPTIONS = [{
                name: "OK",
                key: "ok"
            }];

        /**
         * Populates a `dialogModel` to pass to `dialogService.getUserChoise`
         * in order to choose between Overwrite and Cancel.
         * @constructor
         * @memberof platform/persistence/queue
         */
        function PersistenceFailureDialog(failures) {
            var revisionErrors = [],
                otherErrors = [];

            // Place this failure into an appropriate group
            function categorizeFailure(failure) {
                // Check if the error is due to object revision
                var isRevisionError = ((failure || {}).error || {}).key
                    === PersistenceFailureConstants.REVISION_ERROR_KEY;
                // Push the failure into the appropriate group
                (isRevisionError ? revisionErrors : otherErrors).push(failure);
            }

            // Separate into revision errors, and other errors
            failures.forEach(categorizeFailure);

            return {
                title: "Save Error",
                template: "persistence-failure-dialog",
                model: {
                    revised: revisionErrors,
                    unrecoverable: otherErrors
                },
                options: revisionErrors.length > 0
                    ? OVERWRITE_CANCEL_OPTIONS : OK_OPTIONS
            };
        }

        return PersistenceFailureDialog;
    }
);
