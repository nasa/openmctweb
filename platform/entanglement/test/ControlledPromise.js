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
    function () {

        /**
         * An instrumented promise implementation for better control of promises
         * during tests.
         *
         */
        function ControlledPromise() {
            this.resolveHandlers = [];
            this.rejectHandlers = [];
            spyOn(this, 'then').and.callThrough();
        }

        /**
         * Resolve the promise, passing the supplied value to all resolve
         * handlers.
         */
        ControlledPromise.prototype.resolve = function (value) {
            this.resolveHandlers.forEach(function (handler) {
                handler(value);
            });
        };

        /**
         * Reject the promise, passing the supplied value to all rejection
         * handlers.
         */
        ControlledPromise.prototype.reject = function (value) {
            this.rejectHandlers.forEach(function (handler) {
                handler(value);
            });
        };

        /**
         * Standard promise.then, returns a promise that support chaining.
         * TODO: Need to support resolve/reject handlers that return promises.
         */
        ControlledPromise.prototype.then = function (onResolve, onReject) {
            var returnPromise = new ControlledPromise();

            if (onResolve) {
                this.resolveHandlers.push(function (resolveWith) {
                    var chainResult = onResolve(resolveWith);
                    if (chainResult && chainResult.then) {
                        // chainResult is a promise, resolve when it resolves.
                        chainResult.then(function (pipedResult) {
                            return returnPromise.resolve(pipedResult);
                        });
                    } else {
                        returnPromise.resolve(chainResult);
                    }
                });
            }

            if (onReject) {
                this.rejectHandlers.push(function (rejectWith) {
                    var chainResult = onReject(rejectWith);
                    if (chainResult && chainResult.then) {
                        chainResult.then(function (pipedResult) {
                            returnPromise.reject(pipedResult);
                        });
                    } else {
                        returnPromise.reject(chainResult);
                    }
                });
            }

            return returnPromise;
        };

        return ControlledPromise;

    }
);
