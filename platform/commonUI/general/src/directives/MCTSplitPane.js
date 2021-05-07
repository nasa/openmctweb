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

        // Pixel width to allocate for the splitter itself
        var DEFAULT_ANCHOR = 'left',
            POLLING_INTERVAL = 15, // milliseconds
            CHILDREN_WARNING_MESSAGE = [
                "Invalid mct-split-pane contents.",
                "This element should contain exactly three",
                "child elements, where the middle-most element",
                "is an mct-splitter."
            ].join(" "),
            ANCHOR_WARNING_MESSAGE = [
                "Unknown anchor provided to mct-split-pane,",
                "defaulting to",
                DEFAULT_ANCHOR + "."
            ].join(" "),
            ANCHORS = {
                left: {
                    edge: "left",
                    opposite: "right",
                    dimension: "width",
                    orientation: "vertical"
                },
                right: {
                    edge: "right",
                    opposite: "left",
                    dimension: "width",
                    orientation: "vertical",
                    reversed: true
                },
                top: {
                    edge: "top",
                    opposite: "bottom",
                    dimension: "height",
                    orientation: "horizontal"
                },
                bottom: {
                    edge: "bottom",
                    opposite: "top",
                    dimension: "height",
                    orientation: "horizontal",
                    reversed: true
                }
            };

        /**
         * Implements `mct-split-pane` directive.
         *
         * This takes the following attributes:
         * * `position`: Two-way bound scope variable which will contain
         *   the pixel position of the splitter, offset from the appropriate
         *   edge.
         * * `anchor`: Plain string, one of "left", "right", "top",
         *    or "bottom".
         *
         * When used, an `mct-split-pane` element should contain exactly
         * three child elements, where the middle is an `mct-splitter`
         * element. These should be included in either left-to-right
         * or top-to-bottom order (depending on anchoring.) If the contents
         * do not match this form, `mct-split-pane` will issue a warning
         * and its behavior will be undefined.
         *
         * This directive works by setting the width of the element
         * nearest the anchor edge, and then positioning the other elements
         * based on its observed width. As such, `min-width`, `max-width`,
         * etc. can be set on that element to control the splitter's
         * allowable positions.
         *
         * @memberof platform/commonUI/general
         * @constructor
         */
        function MCTSplitPane($parse, $log, $interval, $window) {
            function controller($scope, $element, $attrs) {
                var anchorKey = $attrs.anchor || DEFAULT_ANCHOR,
                    positionParsed = $parse($attrs.position),
                    anchor,
                    activeInterval,
                    position,
                    splitterSize,

                    alias = $attrs.alias !== undefined
                        ? "mctSplitPane-" + $attrs.alias : undefined,

                    //convert string to number from localStorage
                    userWidthPreference = $window.localStorage.getItem(alias) === null
                        ? undefined : Number($window.localStorage.getItem(alias));

                // Get relevant size (height or width) of DOM element
                function getSize(domElement) {
                    return (anchor.orientation === 'vertical'
                        ? domElement.offsetWidth : domElement.offsetHeight);
                }

                // Apply styles to child elements
                function updateChildren(children) {
                    position = userWidthPreference || position;

                    // Pick out correct elements to update, flowing from
                    // selected anchor edge.
                    var first = children.eq(anchor.reversed ? 2 : 0),
                        splitter = children.eq(1),
                        last = children.eq(anchor.reversed ? 0 : 2),
                        firstSize;

                    splitterSize = getSize(splitter[0]);
                    first.css(anchor.edge, "0px");
                    first.css(anchor.dimension, position + 'px');

                    // Get actual size (to obey min-width etc.)
                    firstSize = getSize(first[0]);
                    first.css(anchor.dimension, firstSize + 'px');
                    splitter.css(anchor.edge, firstSize + 'px');
                    splitter.css(anchor.opposite, "auto");

                    last.css(anchor.edge, firstSize + splitterSize + 'px');
                    last.css(anchor.opposite, '0px');
                    position = firstSize;
                }

                // Update positioning of contained elements
                function updateElementPositions() {
                    var children = $element.children();

                    // Check to make sure contents are well-formed
                    if (children.length !== 3
                            || children[1].nodeName.toLowerCase() !== 'mct-splitter') {
                        $log.warn(CHILDREN_WARNING_MESSAGE);

                        return;
                    }

                    updateChildren(children);
                }

                // Enforce minimum/maximum positions
                function enforceExtrema() {
                    position = Math.max(position, 0);
                    position = Math.min(position, getSize($element[0]));
                }

                // Getter-setter for the pixel offset of the splitter,
                // relative to the current edge.
                function getSetPosition(value) {
                    var prior = position;
                    if (typeof value === 'number') {
                        position = value;
                        enforceExtrema();
                        updateElementPositions();

                        // Pass change up so this state can be shared
                        if (positionParsed.assign && position !== prior) {
                            positionParsed.assign($scope, position);
                        }
                    }

                    return position;
                }

                function setUserWidthPreference(value) {
                    if (alias) {
                        userWidthPreference = value;
                    }
                }

                function persistToLocalStorage(value) {
                    if (alias) {
                        $window.localStorage.setItem(alias, value);
                    }
                }

                // Dynamically apply a CSS class to elements when the user
                // is actively resizing
                function toggleClass(classToToggle) {
                    $element.children().toggleClass(classToToggle);
                }

                // Make sure anchor parameter is something we know
                if (!ANCHORS[anchorKey]) {
                    $log.warn(ANCHOR_WARNING_MESSAGE);
                    anchorKey = DEFAULT_ANCHOR;
                }

                anchor = ANCHORS[anchorKey];

                $scope.$watch($attrs.position, getSetPosition);

                $element.addClass("split-layout");
                $element.addClass(anchor.orientation);

                // Initialize positions
                getSetPosition(getSize(
                    $element.children().eq(anchor.reversed ? 2 : 0)[0]
                ));

                // And poll for position changes enforced by styles
                activeInterval = $interval(function () {
                    getSetPosition(getSetPosition());
                }, POLLING_INTERVAL, 0, false);
                // ...and stop polling when we're destroyed.
                $scope.$on('$destroy', function () {
                    $interval.cancel(activeInterval);
                });

                // Interface exposed by controller, for mct-splitter to user
                return {
                    anchor: function () {
                        return anchor;
                    },
                    position: function (newPosition) {
                        if (arguments.length === 0) {
                            return getSetPosition();
                        }

                        setUserWidthPreference(newPosition);

                        return getSetPosition(newPosition);
                    },
                    startResizing: function () {
                        toggleClass('resizing');
                    },
                    endResizing: function (finalPosition) {
                        persistToLocalStorage(finalPosition);
                        toggleClass('resizing');
                    }
                };
            }

            return {
                // Restrict to attributes
                restrict: "E",
                // Expose its controller
                controller: ['$scope', '$element', '$attrs', controller]
            };
        }

        return MCTSplitPane;

    }
);
