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
         * Implements `mct-scroll-x` and `mct-scroll-y` directives. Listens
         * for scroll events and publishes their results into scope; watches
         * scope and updates scroll state to match. This varies for x- and y-
         * directives only by the attribute name chosen to find the expression,
         * and the property (scrollLeft or scrollTop) managed within the
         * element.
         *
         * This is exposed as two directives in `bundle.json`; the difference
         * is handled purely by parameterization.
         *
         * @memberof platform/commonUI/general
         * @constructor
         * @param $parse Angular's $parse
         * @param {string} property property to manage within the HTML element
         * @param {string} attribute attribute to look at for the assignable
         *        Angular expression
         */
        function MCTScroll($parse, property, attribute) {
            function link(scope, element, attrs) {
                var expr = attrs[attribute],
                    parsed = $parse(expr);

                // Set the element's scroll to match the scope's state
                function updateElement(value) {
                    element[0][property] = value;
                }

                // Handle event; assign to scroll state to scope
                function updateScope() {
                    parsed.assign(scope, element[0][property]);
                    scope.$apply(expr);
                }

                // Initialize state in scope
                parsed.assign(scope, element[0][property]);

                // Update element state when value in scope changes
                scope.$watch(expr, updateElement);

                // Update state in scope when element is scrolled
                element.on('scroll', updateScope);
            }

            return {
                // Restrict to attributes
                restrict: "A",
                // Use this link function
                link: link
            };
        }

        return MCTScroll;

    }
);
