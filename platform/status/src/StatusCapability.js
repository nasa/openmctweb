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
         * The `status` capability can be used to attach information
         * about the state of a domain object, expressed as simple
         * string flags.
         *
         * Representations of domain objects will also receive CSS
         * classes which reflect their current status.
         * (@see platform/status.StatusRepresenter)
         *
         * @param {platform/status.StatusService} statusService
         *        the service which will track domain object status
         *        within the application.
         * @param {DomainObject} the domain object whose status will
         *        be tracked.
         * @constructor
         * @memberof platform/status
         */
        function StatusCapability(statusService, domainObject) {
            this.statusService = statusService;
            this.domainObject = domainObject;
        }

        /**
         * List all status flags currently set for this domain object.
         * @returns {string[]} all current status flags.
         */
        StatusCapability.prototype.list = function () {
            return this.statusService.listStatuses(this.domainObject.getId());
        };

        /**
         * Check if a status flag is currently set for this domain object.
         * @param {string} status the status to get
         * @returns {boolean} true if the flag is present, otherwise false
         */
        StatusCapability.prototype.get = function (status) {
            return this.list().indexOf(status) !== -1;
        };

        /**
         * Set a status flag on this domain object.
         * @param {string} status the status to set
         * @param {boolean} state true if the domain object should
         *        possess this status, false if it should not
         */
        StatusCapability.prototype.set = function (status, state) {
            return this.statusService.setStatus(
                this.domainObject.getId(),
                status,
                state
            );
        };

        /**
         * Listen for changes in this domain object's status.
         * @param {Function} callback function to invoke on changes;
         *        called with the new status of the domain object, as an
         *        array of strings
         * @returns {Function} a function which can be used to stop
         *          listening to status changes for this domain object.
         */
        StatusCapability.prototype.listen = function (callback) {
            return this.statusService.listen(
                this.domainObject.getId(),
                callback
            );
        };

        return StatusCapability;

    }
);
