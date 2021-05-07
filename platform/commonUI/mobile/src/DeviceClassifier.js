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
    ['./DeviceMatchers'],
    function (DeviceMatchers) {

        /**
         * Runs at application startup and adds a subset of the following
         * CSS classes to the body of the document, depending on device
         * attributes:
         *
         * * `mobile`: Phones or tablets.
         * * `phone`: Phones specifically.
         * * `tablet`: Tablets specifically.
         * * `desktop`: Non-mobile devices.
         * * `portrait`: Devices in a portrait-style orientation.
         * * `landscape`: Devices in a landscape-style orientation.
         * * `touch`: Device supports touch events.
         *
         * @param {platform/commonUI/mobile.AgentService} agentService
         *        the service used to examine the user agent
         * @param $document Angular's jqLite-wrapped document element
         * @constructor
         */
        function MobileClassifier(agentService, $document) {
            var body = $document.find('body');

            Object.keys(DeviceMatchers).forEach(function (key, index, array) {
                if (DeviceMatchers[key](agentService)) {
                    body.addClass(key);
                }
            });

            if (agentService.isMobile()) {
                var mediaQuery = window.matchMedia('(orientation: landscape)');

                mediaQuery.addListener(function (event) {
                    if (event.matches) {
                        body.removeClass('portrait');
                        body.addClass('landscape');
                    } else {
                        body.removeClass('landscape');
                        body.addClass('portrait');
                    }
                });
            }
        }

        return MobileClassifier;

    }
);
