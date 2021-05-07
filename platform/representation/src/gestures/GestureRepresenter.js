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
         * The GestureRepresenter is responsible for installing predefined
         * gestures upon mct-representation instances.
         * Gestures themselves are pulled from the gesture service; this
         * simply wraps that behavior in a Representer interface, such that
         * it may be included among other such Representers used to prepare
         * specific representations.
         * @param {GestureService} gestureService the service which provides
         *        gestures
         * @param {Scope} scope the Angular scope for this representation
         * @param element the JQLite-wrapped mct-representation element
         * @constructor
         * @implements {Representer}
         * @memberof platform/representation
         */
        function GestureRepresenter(gestureService, scope, element) {
            this.gestureService = gestureService;
            this.element = element;
        }

        GestureRepresenter.prototype.represent = function represent(representation, domainObject) {
            // Clear out any existing gestures
            this.destroy();

            // Attach gestures - by way of the service.
            this.gestureHandle = this.gestureService.attachGestures(
                this.element,
                domainObject,
                (representation || {}).gestures || []
            );
        };

        GestureRepresenter.prototype.destroy = function () {
            // Release any resources associated with these gestures
            if (this.gestureHandle) {
                this.gestureHandle.destroy();
            }
        };

        return GestureRepresenter;
    }
);
