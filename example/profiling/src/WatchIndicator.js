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
         * Updates a count of currently-active Angular watches.
         * @constructor
         * @param $interval Angular's $interval
         */
        function WatchIndicator($interval, $rootScope) {
            var watches = 0;

            function count(scope) {
                if (scope) {
                    watches += (scope.$$watchers || []).length;
                    count(scope.$$childHead);
                    count(scope.$$nextSibling);
                }
            }

            function update() {
                watches = 0;
                count($rootScope);
            }

            // Update state every second
            $interval(update, 1000);

            // Provide initial state, too
            update();

            return {
                /**
                 * Get the CSS class (single character used as an icon)
                 * to display in this indicator. This will return ".",
                 * which should appear as a database icon.
                 * @returns {string} the character of the database icon
                 */
                getCssClass: function () {
                    return "icon-database";
                },
                /**
                 * Get the text that should appear in the indicator.
                 * @returns {string} brief summary of connection status
                 */
                getText: function () {
                    return watches + " watches";
                },
                /**
                 * Get a longer-form description of the current connection
                 * space, suitable for display in a tooltip
                 * @returns {string} longer summary of connection status
                 */
                getDescription: function () {
                    return "";
                }
            };
        }

        return WatchIndicator;

    }
);
