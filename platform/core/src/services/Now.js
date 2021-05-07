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
         * Defines the `now` service, which is a simple wrapper upon
         * `Date.now()` which can be injected to support testability.
         *
         * @returns {Function} a function which returns current system time
         * @memberof platform/core
         */
        function Now() {
            /**
             * Get the current time.
             * @returns {number} current time, in milliseconds since
             *          1970-01-01 00:00:00Z
             * @memberof platform/core.Now#
             */
            return function () {
                return Date.now();
            };
        }

        return Now;
    }
);
