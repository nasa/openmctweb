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
         * The `mct-device` directive, when applied as an attribute,
         * only includes the element when the device being used matches
         * a set of characteristics required.
         *
         * Required characteristics are given as space-separated strings
         * as the value to this attribute, e.g.:
         *
         *    <span mct-device="mobile portrait">Hello world!</span>
         *
         * ...will only show Hello world! when viewed on a mobile device
         * in the portrait orientation.
         *
         * Valid device characteristics to detect are:
         *
         * * `mobile`: Phones or tablets.
         * * `phone`: Phones specifically.
         * * `tablet`: Tablets specifically.
         * * `desktop`: Non-mobile devices.
         * * `portrait`: Devices in a portrait-style orientation.
         * * `landscape`: Devices in a landscape-style orientation.
         * * `touch`: Device supports touch events.
         *
         * @param {AgentService} agentService used to detect device type
         *        based on information about the user agent
         */
        function MCTDevice(agentService) {

            function deviceMatches(tokens) {
                tokens = tokens || "";

                return tokens.split(" ").every(function (token) {
                    var fn = DeviceMatchers[token];

                    return fn && fn(agentService);
                });
            }

            function link(scope, element, attrs, ctrl, transclude) {
                if (deviceMatches(attrs.mctDevice)) {
                    transclude(function (clone) {
                        element.replaceWith(clone);
                    });
                }
            }

            return {
                link: link,
                // We are transcluding the whole element (like ng-if)
                transclude: 'element',
                // 1 more than ng-if
                priority: 601,
                // Also terminal, since element will be transcluded
                terminal: true,
                // Only apply as an attribute
                restrict: "A"
            };
        }

        return MCTDevice;
    }
);
