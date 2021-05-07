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
         * The mct-selectable directive allows selection functionality
         * (click) to be attached to specific elements.
         *
         * Example of how to use the directive:
         *
         *   mct-selectable="{
         *       // item is an optional domain object.
         *       item: domainObject,
         *       // Can define other arbitrary properties.
         *       elementProxy: element,
         *       controller: fixedController
         *  }"
         *
         * @memberof platform/commonUI/general
         * @constructor
         */
        function MCTSelectable(openmct) {

            // Link; install event handlers.
            function link(scope, element, attrs) {
                var isDestroyed = false;
                scope.$on("$destroy", function () {
                    isDestroyed = true;
                });

                openmct.$injector.get('$timeout')(function () {
                    if (isDestroyed) {
                        return;
                    }

                    var removeSelectable = openmct.selection.selectable(
                        element[0],
                        scope.$eval(attrs.mctSelectable),
                        Object.prototype.hasOwnProperty.call(attrs, 'mctInitSelect')
                        && scope.$eval(attrs.mctInitSelect) !== false
                    );

                    scope.$on("$destroy", function () {
                        removeSelectable();
                    });
                });

            }

            return {
                // mct-selectable only makes sense as an attribute
                restrict: "A",
                // Link function, to install event handlers
                link: link
            };

        }

        return MCTSelectable;
    }
);
