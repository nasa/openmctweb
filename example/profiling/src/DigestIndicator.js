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
        "use strict";

        /**
         * Displays the number of digests that have occurred since the
         * indicator was first instantiated.
         * @constructor
         * @param $interval Angular's $interval
         * @implements {Indicator}
         */
        function DigestIndicator($interval, $rootScope) {
            var digests = 0,
                displayed = 0,
                start = Date.now();

            function update() {
                var now = Date.now(),
                    secs = (now - start) / 1000;
                displayed = Math.round(digests / secs);
                start = now;
                digests = 0;
            }

            function increment() {
                digests += 1;
            }

            $rootScope.$watch(increment);

            // Update state every second
            $interval(update, 1000);

            // Provide initial state, too
            update();

            return {
                /**
                 * Get the CSS class that defines the icon
                 * to display in this indicator. This will appear
                 * as a dataflow icon.
                 * @returns {string} the cssClass of the dataflow icon
                 */
                getCssClass: function () {
                    return "icon-connectivity";
                },
                getText: function () {
                    return displayed + " digests/sec";
                },
                getDescription: function () {
                    return "";
                }
            };
        }

        return DigestIndicator;

    }
);
