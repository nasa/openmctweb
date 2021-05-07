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
         * The `mct-click-elsewhere` directive will evaluate its
         * associated expression whenever a `mousedown` occurs anywhere
         * outside of the element that has the `mct-click-elsewhere`
         * directive attached. This is useful for dismissing popups
         * and the like.
         */
        function MCTClickElsewhere($document) {

            // Link; install event handlers.
            function link(scope, element, attrs) {
                // Keep a reference to the body, to attach/detach
                // mouse event handlers; mousedown and mouseup cannot
                // only be attached to the element being linked, as the
                // mouse may leave this element during the drag.
                var body = $document.find('body');

                function clickBody(event) {
                    var x = event.clientX,
                        y = event.clientY,
                        rect = element[0].getBoundingClientRect(),
                        xMin = rect.left,
                        xMax = xMin + rect.width,
                        yMin = rect.top,
                        yMax = yMin + rect.height;

                    if (x < xMin || x > xMax || y < yMin || y > yMax) {
                        scope.$apply(function () {
                            scope.$eval(attrs.mctClickElsewhere);
                        });
                    }
                }

                body.on("mousedown", clickBody);
                scope.$on("$destroy", function () {
                    body.off("mousedown", clickBody);
                });
            }

            return {
                // mct-drag only makes sense as an attribute
                restrict: "A",
                // Link function, to install event handlers
                link: link
            };
        }

        return MCTClickElsewhere;
    }
);

