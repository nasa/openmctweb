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
    ['../InfoConstants'],
    function (InfoConstants) {

        var BUBBLE_TEMPLATE = InfoConstants.BUBBLE_TEMPLATE,
            MOBILE_POSITION = InfoConstants.BUBBLE_MOBILE_POSITION,
            OPTIONS = InfoConstants.BUBBLE_OPTIONS;

        /**
         * Displays informative content ("info bubbles") for the user.
         * @memberof platform/commonUI/inspect
         * @constructor
         */
        function InfoService($compile, $rootScope, popupService, agentService) {
            this.$compile = $compile;
            this.$rootScope = $rootScope;
            this.popupService = popupService;
            this.agentService = agentService;
        }

        /**
         * Display an info bubble at the specified location.
         * @param {string} templateKey template to place in bubble
         * @param {string} title title for the bubble
         * @param {*} content content to pass to the template, via
         *        `ng-model`
         * @param {number[]} x,y position of the info bubble, in
         *        pixel coordinates.
         * @returns {Function} a function that may be invoked to
         *          dismiss the info bubble
         */
        InfoService.prototype.display = function (templateKey, title, content, position) {
            var $compile = this.$compile,
                $rootScope = this.$rootScope,
                scope = $rootScope.$new(),
                span = $compile('<span></span>')(scope),
                bubbleSpaceLR = InfoConstants.BUBBLE_MARGIN_LR
                    + InfoConstants.BUBBLE_MAX_WIDTH,
                options,
                popup,
                bubble;

            options = Object.create(OPTIONS);
            options.marginX = -bubbleSpaceLR;

            // prevent bubble from appearing right under pointer,
            // which causes hover callback to be called multiple times
            options.offsetX = 1;

            // On a phone, bubble takes up more screen real estate,
            // so position it differently (toward the bottom)
            if (this.agentService.isPhone()) {
                position = MOBILE_POSITION;
                options = {};
            }

            popup = this.popupService.display(span, position, options);

            // Pass model & container parameters into the scope
            scope.bubbleModel = content;
            scope.bubbleTemplate = templateKey;
            scope.bubbleTitle = title;
            // Style the bubble according to how it was positioned
            scope.bubbleLayout = [
                popup.goesUp() ? 'arw-btm' : 'arw-top',
                popup.goesLeft() ? 'arw-right' : 'arw-left'
            ].join(' ');

            // Create the info bubble, now that we know how to
            // point the arrow...
            bubble = $compile(BUBBLE_TEMPLATE)(scope);
            span.append(bubble);

            // Return a function to dismiss the info bubble
            return function dismiss() {
                popup.dismiss();
                scope.$destroy();
            };
        };

        return InfoService;
    }
);

