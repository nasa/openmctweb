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
         * The mct-drag directive allows drag functionality
         * (in the mousedown-mousemove-mouseup sense, as opposed to
         * the drag-and-drop sense) to be attached to specific
         * elements. This takes the form of three attributes:
         *
         * * `mct-drag`: An Angular expression to evaluate during
         *   drag movement.
         * * `mct-drag-down`: An Angular expression to evaluate
         *   when the drag begins.
         * * `mct-drag-up`: An Angular expression to evaluate when
         *   dragging ends.
         *
         * In each case, a variable `delta` will be provided to the
         * expression; this is a two-element array or the horizontal
         * and vertical pixel offset of the current mouse position
         * relative to the mouse position where dragging began.
         *
         * @memberof platform/commonUI/general
         * @constructor
         *
         */
        function MCTDrag($document, agentService) {

            // Link; install event handlers.
            function link(scope, element, attrs) {
                // Keep a reference to the body, to attach/detach
                // mouse event handlers; mousedown and mouseup cannot
                // only be attached to the element being linked, as the
                // mouse may leave this element during the drag.
                var body = $document.find('body'),
                    isMobile = agentService.isMobile(),
                    touchEvents,
                    initialPosition,
                    $event,
                    delta;

                if (isMobile) {
                    touchEvents = {
                        start: 'touchstart',
                        end: 'touchend',
                        move: 'touchmove'
                    };
                } else {
                    touchEvents = {
                        start: 'mousedown',
                        end: "mouseup",
                        move: "mousemove"
                    };
                }

                // Utility function to cause evaluation of mctDrag,
                // mctDragUp, etc
                function fireListener(name) {
                    // Evaluate the expression, with current delta
                    scope.$eval(attrs[name], {
                        delta: delta,
                        $event: $event
                    });

                    // Trigger prompt digestion
                    scope.$apply();
                }

                // Update positions (both actual and relative)
                // based on a new mouse event object.
                function updatePosition(event) {
                    // Get the current position, as an array
                    var currentPosition = [event.pageX, event.pageY];

                    // Track the initial position, if one hasn't been observed
                    initialPosition = initialPosition || currentPosition;

                    // Compute relative position
                    delta = currentPosition.map(function (v, i) {
                        return v - initialPosition[i];
                    });

                    // Also track the plain event for firing listeners
                    $event = event;
                }

                // Called during a drag, on mousemove
                function continueDrag(event) {
                    updatePosition(event);
                    fireListener("mctDrag");

                    // Don't show selection highlights, etc
                    event.preventDefault();

                    return false;
                }

                // Called only when the drag ends (on mouseup)
                function endDrag(event) {
                    // Detach event handlers
                    body.off(touchEvents.end, endDrag);
                    body.off(touchEvents.move, continueDrag);

                    // Also call continueDrag, to fire mctDrag
                    // and do its usual position update
                    continueDrag(event);

                    fireListener("mctDragUp");

                    // Clear out start-of-drag position, target
                    initialPosition = undefined;

                    // Don't show selection highlights, etc
                    event.preventDefault();

                    return false;
                }

                // Called on mousedown on the element
                function startDrag(event) {
                    // Listen for mouse events at the body level,
                    // since the mouse may leave the element during
                    // the drag.
                    body.on(touchEvents.end, endDrag);
                    body.on(touchEvents.move, continueDrag);

                    // Set an initial position
                    updatePosition(event);

                    // Fire listeners, including mctDrag
                    fireListener("mctDragDown");
                    fireListener("mctDrag");

                    // Don't show selection highlights, etc
                    event.preventDefault();

                    return false;
                }

                // Listen for start event on the element
                element.on(touchEvents.start, startDrag);
            }

            return {
                // mct-drag only makes sense as an attribute
                restrict: "A",
                // Link function, to install event handlers
                link: link
            };
        }

        return MCTDrag;
    }
);

