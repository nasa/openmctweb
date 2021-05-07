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
 * Implements Open MCT's About dialog.
 * @namespace platform/commonUI/about
 */
define(
    [],
    function () {

        /**
         * The AboutController provides information to populate the
         * About dialog.
         * @memberof platform/commonUI/about
         * @constructor
         * @param {object[]} versions an array of version extensions;
         *        injected from `versions[]`
         * @param $window Angular-injected window object
         */
        function AboutController(versions, $window) {
            this.versionDefinitions = versions;
            this.$window = $window;
        }

        /**
         * Get version info. This is given as an array of
         * objects, where each object is intended to appear
         * as a line-item in the version information listing.
         * @returns {object[]} version information
         */
        AboutController.prototype.versions = function () {
            return this.versionDefinitions;
        };

        /**
         * Open a new window (or tab, depending on browser
         * configuration) containing open source licenses.
         */
        AboutController.prototype.openLicenses = function () {
            // Open a new browser window at the licenses route
            this.$window.open("#/licenses");
        };

        return AboutController;
    }
);
