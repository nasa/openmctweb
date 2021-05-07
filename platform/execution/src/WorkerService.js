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

/**
 * This bundle contains services for managing the flow of execution,
 * such as support for running web workers on background threads.
 * @namespace platform/execution
 */
define(
    [],
    function () {

        /**
         * Handles the execution of WebWorkers.
         * @memberof platform/execution
         * @constructor
         */
        function WorkerService($window, workers) {
            var workerUrls = {},
                sharedWorkers = {};

            function addWorker(worker) {
                var key = worker.key;
                if (!workerUrls[key]) {
                    if (worker.scriptUrl) {
                        workerUrls[key] = [
                            worker.bundle.path,
                            worker.bundle.sources,
                            worker.scriptUrl
                        ].join("/");
                    } else if (worker.scriptText) {
                        var blob = new Blob(
                            [worker.scriptText],
                            {type: 'application/javascript'}
                        );
                        workerUrls[key] = URL.createObjectURL(blob);
                    }

                    sharedWorkers[key] = worker.shared;
                }
            }

            (workers || []).forEach(addWorker);
            this.workerUrls = workerUrls;
            this.sharedWorkers = sharedWorkers;
            this.Worker = $window.Worker;
            this.SharedWorker = $window.SharedWorker;
        }

        /**
         * Start running a new web worker. This will run a worker
         * that has been registered under the `workers` category
         * of extension.
         *
         * This will return either a Worker or a SharedWorker,
         * depending on whether a `shared` flag has been specified
         * on the the extension definition for the referenced worker.
         *
         * @param {string} key symbolic identifier for the worker
         * @returns {Worker | SharedWorker} the running Worker
         */
        WorkerService.prototype.run = function (key) {
            var scriptUrl = this.workerUrls[key],
                Worker = this.sharedWorkers[key]
                    ? this.SharedWorker : this.Worker;

            return scriptUrl && Worker && new Worker(scriptUrl);
        };

        return WorkerService;
    }
);

