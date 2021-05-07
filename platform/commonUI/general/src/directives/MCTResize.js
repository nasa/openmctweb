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

        // Default resize interval
        var DEFAULT_INTERVAL = 100;

        /**
         * The mct-resize directive allows the size of a displayed
         * HTML element to be tracked. This is done by polling,
         * since the DOM API does not currently provide suitable
         * events to watch this reliably.
         *
         * Attributes related to this directive are interpreted as
         * follows:
         *
         * * `mct-resize`: An Angular expression to evaluate when
         *   the size changes; the variable `bounds` will be provided
         *   with two fields, `width` and `height`, both in pixels.
         * * `mct-resize-interval`: Optional; the interval, in milliseconds,
         *   at which to watch for updates. In some cases checking for
         *   resize can carry a cost (it forces recalculation of
         *   positions within the document) so it may be preferable to watch
         *   infrequently. If omitted, a default of 100ms will be used.
         *   This is an Angular expression, and it will be re-evaluated after
         *   each interval.
         *
         * @memberof platform/commonUI/general
         * @constructor
         *
         */
        function MCTResize($timeout) {

            // Link; start listening for changes to an element's size
            function link(scope, element, attrs) {
                var lastBounds,
                    linking = true,
                    active = true;

                // Determine how long to wait before the next update
                function currentInterval() {
                    return attrs.mctResizeInterval
                        ? scope.$eval(attrs.mctResizeInterval)
                        : DEFAULT_INTERVAL;
                }

                // Evaluate mct-resize with the current bounds
                function fireEval(bounds) {
                    // Only update when bounds actually change
                    if (!lastBounds
                            || lastBounds.width !== bounds.width
                            || lastBounds.height !== bounds.height) {
                        scope.$eval(attrs.mctResize, { bounds: bounds });
                        if (!linking) { // Avoid apply-in-a-digest
                            scope.$apply();
                        }

                        lastBounds = bounds;
                    }
                }

                // Callback to fire after each timeout;
                // update bounds and schedule another timeout
                function onInterval() {
                    if (!active) {
                        return;
                    }

                    fireEval({
                        width: element[0].offsetWidth,
                        height: element[0].offsetHeight
                    });
                    $timeout(onInterval, currentInterval(), false);
                }

                // Stop running in the background
                function deactivate() {
                    active = false;
                }

                // Unregister once out-of-scope
                scope.$on("$destroy", deactivate);

                // Handle the initial callback
                onInterval();

                // Trigger scope.$apply on subsequent changes
                linking = false;
            }

            return {
                // mct-resize only makes sense as an attribute
                restrict: "A",
                // Link function, to begin watching for changes
                link: link
            };
        }

        return MCTResize;
    }
);
