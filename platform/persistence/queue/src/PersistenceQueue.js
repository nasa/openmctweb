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
        './PersistenceQueueImpl',
        './PersistenceQueueHandler',
        './PersistenceFailureHandler'
    ],
    function (
        PersistenceQueueImpl,
        PersistenceQueueHandler,
        PersistenceFailureHandler
    ) {

        /**
         * The PersistenceQueue is used by the QueuingPersistenceCapability
         * to aggregate calls for object persistence. These are then issued
         * in a group, such that if some or all are rejected, this result can
         * be shown to the user (again, in a group.)
         *
         * This constructor is exposed as a service, but handles only the
         * wiring of injected dependencies; behavior is implemented in the
         * various component parts.
         *
         * @param $timeout Angular's $timeout
         * @param {PersistenceQueueHandler} handler handles actual
         *        persistence when the queue is flushed
         * @param {number} [DELAY] optional; delay in milliseconds between
         *        attempts to flush the queue
         * @constructor
         * @memberof platform/persistence/queue
         */
        function PersistenceQueue(
            $q,
            $timeout,
            dialogService,
            PERSISTENCE_QUEUE_DELAY
        ) {
            // Wire up injected dependencies
            return new PersistenceQueueImpl(
                $q,
                $timeout,
                new PersistenceQueueHandler(
                    $q,
                    new PersistenceFailureHandler(
                        $q,
                        dialogService
                    )
                ),
                PERSISTENCE_QUEUE_DELAY
            );
        }

        return PersistenceQueue;
    }
);
