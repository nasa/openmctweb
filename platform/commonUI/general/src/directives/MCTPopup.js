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
    function () {

        var TEMPLATE = "<div></div>";

        /**
         * The `mct-popup` directive may be used to display elements
         * which "pop up" over other parts of the page. Typically, this is
         * done in conjunction with an `ng-if` to control the visibility
         * of the popup.
         *
         * Example of usage:
         *
         *     <mct-popup ng-if="someExpr">
         *         <span>These are the contents of the popup!</span>
         *     </mct-popup>
         *
         * @constructor
         * @memberof platform/commonUI/general
         * @param $compile Angular's $compile service
         * @param {platform/commonUI/general.PopupService} popupService
         */
        function MCTPopup($compile, popupService) {
            function link(scope, element, attrs, ctrl, transclude) {
                var div = $compile(TEMPLATE)(scope),
                    rect = element.parent()[0].getBoundingClientRect(),
                    position = [rect.left, rect.top],
                    popup = popupService.display(div, position);

                div.addClass('t-popup');
                transclude(function (clone) {
                    div.append(clone);
                });

                scope.$on('$destroy', function () {
                    popup.dismiss();
                });
            }

            return {
                restrict: "E",
                transclude: true,
                link: link,
                scope: {}
            };
        }

        return MCTPopup;
    }
);
