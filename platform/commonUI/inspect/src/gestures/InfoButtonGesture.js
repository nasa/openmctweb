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
         * The `info` gesture displays domain object metadata in a
         * bubble on hover.
         *
         * @constructor
         * @param $document Angular's `$document`
         * @param {InfoService} infoService a service which shows info bubbles
         * @param element jqLite-wrapped DOM element
         * @param {DomainObject} domainObject the domain object for which to
         *        show information
         */
        function InfoGestureButton($document, agentService, infoService, element, domainObject) {
            var dismissBubble,
                touchPosition,
                body = $document.find('body');

            function trackPosition(event) {
                // Record touch position, so bubble can be shown at latest
                // touch position, also offset by 22px to left (accounts for
                // a finger-sized touch on the info button)
                touchPosition = [event.clientX - 22, event.clientY];
            }

            // Hides the bubble and detaches the
            // body hidebubble listener
            function hideBubble() {
                // If a bubble is showing, dismiss it
                if (dismissBubble) {
                    dismissBubble();
                    dismissBubble = undefined;
                }

                // Detaches body touch listener
                body.off('touchstart', hideBubble);
            }

            // Displays the bubble by tracking position of
            // touch, using infoService to display the bubble,
            // and then on any body touch the bubble is dismissed
            function showBubble(event) {
                trackPosition(event);
                event.stopPropagation();
                // Show the bubble, but on any touchstart on the
                // body (anywhere) call hidebubble
                dismissBubble = infoService.display(
                    "info-table",
                    domainObject.getModel().name,
                    domainObject.useCapability('metadata'),
                    touchPosition
                );

                // On any touch on the body, default body touches/events
                // are prevented, the bubble is dismissed, and the touchstart
                // body event is unbound, reallowing gestures
                body.on('touchstart', function (evt) {
                    evt.preventDefault();
                    hideBubble();
                    body.unbind('touchstart');
                });
            }

            // Checks if you are on a mobile device, if the device is
            // mobile (agentService.isMobile() = true), then
            // the a click on something (info button) brings up
            // the bubble
            if (agentService.isMobile()) {
                element.on('click', showBubble);
            }

            return {
                /**
                 * Detach any event handlers associated with this gesture.
                 * @memberof InfoGesture
                 * @method
                 */
                destroy: function () {
                    // Dismiss any active bubble...
                    hideBubble();
                    // ...and detach listeners
                    element.off('click', showBubble);
                }
            };
        }

        return InfoGestureButton;

    }

);
