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
 * Provides features which support variant behavior on mobile devices.
 *
 * @namespace platform/commonUI/mobile
 */
define(
    [],
    function () {

        /**
         * The query service handles calls for browser and userAgent
         * info using a comparison between the userAgent and key
         * device names
         * @constructor
         * @param $window Angular-injected instance of the window
         * @memberof platform/commonUI/mobile
         */
        function AgentService($window) {
            var userAgent = $window.navigator.userAgent,
                matches = userAgent.match(/iPad|iPhone|Android/i) || [];

            this.userAgent = userAgent;
            this.mobileName = matches[0];
            this.$window = $window;
            this.touchEnabled = ($window.ontouchstart !== undefined);
        }

        /**
         * Check if the user is on a mobile device.
         * @returns {boolean} true on mobile
         */
        AgentService.prototype.isMobile = function () {
            return Boolean(this.mobileName);
        };

        /**
         * Check if the user is on a phone-sized mobile device.
         * @returns {boolean} true on a phone
         */
        AgentService.prototype.isPhone = function () {
            if (this.isMobile()) {
                if (this.isAndroidTablet()) {
                    return false;
                } else if (this.mobileName === 'iPad') {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        };

        /**
         * Check if the user is on a tablet sized android device
         * @returns {boolean} true on an android tablet
         */
        AgentService.prototype.isAndroidTablet = function () {
            if (this.mobileName === 'Android') {
                if (this.isPortrait() && window.innerWidth >= 768) {
                    return true;
                } else if (this.isLandscape() && window.innerHeight >= 768) {
                    return true;
                }
            } else {
                return false;
            }
        };

        /**
         * Check if the user is on a tablet-sized mobile device.
         * @returns {boolean} true on a tablet
         */
        AgentService.prototype.isTablet = function () {
            return (this.isMobile() && !this.isPhone() && this.mobileName !== 'Android') || (this.isMobile() && this.isAndroidTablet());
        };

        /**
         * Check if the user's device is in a portrait-style
         * orientation (display width is narrower than display height.)
         * @returns {boolean} true in portrait mode
         */
        AgentService.prototype.isPortrait = function () {
            return this.$window.innerWidth < this.$window.innerHeight;
        };

        /**
         * Check if the user's device is in a landscape-style
         * orientation (display width is greater than display height.)
         * @returns {boolean} true in landscape mode
         */
        AgentService.prototype.isLandscape = function () {
            return !this.isPortrait();
        };

        /**
         * Check if the user's device supports a touch interface.
         * @returns {boolean} true if touch is supported
         */
        AgentService.prototype.isTouch = function () {
            return this.touchEnabled;
        };

        /**
         * Check if the user agent matches a certain named device,
         * as indicated by checking for a case-insensitive substring
         * match.
         * @param {string} name the name to check for
         * @returns {boolean} true if the user agent includes that name
         */
        AgentService.prototype.isBrowser = function (name) {
            name = name.toLowerCase();

            return this.userAgent.toLowerCase().indexOf(name) !== -1;
        };

        return AgentService;
    }
);
