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

        // Template to inject into the DOM to show the dialog; really just points to
        // the a specific template that can be included via mct-include
        var TEMPLATE = '<mct-include ng-model="overlay" key="key" ng-class="typeClass"></mct-include>';

        /**
         * The OverlayService is responsible for pre-pending templates to
         * the body of the document, which is useful for displaying templates
         * which need to block the full screen.
         *
         * This is intended to be used by the DialogService; by design, it
         * does not have any protections in place to prevent multiple overlays
         * from being shown at once. (The DialogService does have these
         * protections, and should be used for most overlay-type interactions,
         * particularly where a multiple-overlay effect is not specifically
         * desired).
         *
         * @memberof platform/commonUI/dialog
         * @constructor
         */
        function OverlayService($document, $compile, $rootScope, $timeout) {
            this.$compile = $compile;
            this.$timeout = $timeout;

            // Don't include $document and $rootScope directly;
            // avoids https://docs.angularjs.org/error/ng/cpws
            this.findBody = function () {
                return $document.find('body');
            };

            this.newScope = function () {
                return $rootScope.$new();
            };
        }

        /**
         * Add a new overlay to the document. This will be
         * prepended to the document body; the overlay's
         * template (as pointed to by the `key` argument) is
         * responsible for having a useful z-order, and for
         * blocking user interactions if appropriate.
         *
         * @param {string} key the symbolic key which identifies
         *        the template of the overlay to be shown
         * @param {object} overlayModel the model to pass to the
         *        included overlay template (this will be passed
         *        in via ng-model)
         * @param {string} typeClass the element class to use in rendering
         *        the overlay. Can be specified to provide custom styling of
         *        overlays
         */
        OverlayService.prototype.createOverlay = function (key, overlayModel, typeClass) {
            // Create a new scope for this overlay
            var scope = this.newScope(),
                element;

            // Stop showing the overlay; additionally, release the scope
            // that it uses.
            function dismiss() {
                scope.$destroy();
                element.remove();
            }

            // If no model is supplied, just fill in a default "cancel"
            overlayModel = overlayModel || { cancel: dismiss };

            // Populate the scope; will be passed directly to the template
            scope.overlay = overlayModel;
            scope.key = key;
            scope.typeClass = typeClass || 't-dialog';

            this.$timeout(() => {
                // Create the overlay element and add it to the document's body
                element = this.$compile(TEMPLATE)(scope);

                // Append so that most recent dialog is last in DOM. This means the most recent dialog will be on top when
                // multiple overlays with the same z-index are active.
                this.findBody().append(element);
            });

            return {
                dismiss: dismiss
            };
        };

        return OverlayService;
    }
);
