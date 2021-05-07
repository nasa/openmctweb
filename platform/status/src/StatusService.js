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
    ['./StatusConstants'],
    function (StatusConstants) {

        var STATUS_PREFIX = StatusConstants.TOPIC_PREFIX;

        /**
         * The `statusService` maintains information about the current
         * status of specific domain objects within the system. Status
         * is represented as string flags which are present when a
         * domain object possesses that status, and false when it does
         * not.
         *
         * @param {platform/core.Topic} topic the `topic` service, used
         *        to create/use named listeners.
         * @constructor
         * @memberof platform/status
         */
        function StatusService(topic) {
            this.statusTable = {};
            this.topic = topic;
        }

        /**
         * Get all status flags currently set for a domain object.
         * @param {string} id the identifier of the domain object
         * @returns {string[]} an array containing all status flags currently
         *          applicable to the object with this identifier
         */
        StatusService.prototype.listStatuses = function (id) {
            return this.statusTable[id] || [];
        };

        /**
         * Set a status flag for a domain object.
         * @param {string} id the identifier of the domain object
         * @param {string} status the status to set
         * @param {boolean} state true if the domain object should
         *        possess this status, false if it should not
         */
        StatusService.prototype.setStatus = function (id, status, state) {
            this.statusTable[id] = this.statusTable[id] || [];
            this.statusTable[id] = this.statusTable[id].filter(function (s) {
                return s !== status;
            });
            if (state) {
                this.statusTable[id].push(status);
            }

            this.topic(STATUS_PREFIX + id).notify(this.statusTable[id]);
        };

        /**
         * Listen for changes in a domain object's status.
         * @param {string} id the identifier of the domain object
         * @param {Function} callback function to invoke on changes;
         *        called with the new status of the domain object, as an
         *        array of strings
         * @returns {Function} a function which can be used to stop
         *          listening to status changes for this domain object.
         */
        StatusService.prototype.listen = function (id, callback) {
            return this.topic(STATUS_PREFIX + id).listen(callback);
        };

        return StatusService;

    }
);
