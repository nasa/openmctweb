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

/**
 * Module defining GestureProvider. Created by vwoeltje on 11/22/14.
 */
define(
    [],
    function () {

        /**
         * Handles the attachment of gestures (responses to DOM events,
         * generally) to DOM elements which represent domain objects.
         *
         * @interface GestureService
         */
        /**
         * Attach a set of gestures (indicated by key) to a
         * DOM element which represents a specific domain object.
         * @method GestureService#attachGestures
         * @param element the jqLite-wrapped DOM element which the
         *        user will interact with
         * @param {DomainObject} domainObject the domain object which
         *        is represented by that element
         * @param {string[]} gestureKeys an array of keys identifying
         *        which gestures should apply; these will be matched
         *        against the keys defined in the gestures' extension
         *        definitions
         * @return {Destroyable} an object with a `destroy`
         *         method which can (and should) be used when
         *         gestures should no longer be applied to an element.
         */

        /**
         * The GestureProvider exposes defined gestures. Gestures are used
         * do describe and handle general-purpose interactions with the DOM
         * that should be interpreted as interactions with domain objects,
         * such as right-clicking to expose context menus.
         *
         * Gestures are defined individually as extensions of the
         * `gestures` category. The gesture provider merely serves as an
         * intermediary between these and the `mct-representation` directive
         * where they are used.
         *
         * @memberof platform/representation
         * @implements {GestureService}
         * @constructor
         * @param {Gesture[]} gestures an array of all gestures which are
         *        available as extensions
         */
        function GestureProvider(gestures) {
            var gestureMap = {};

            // Assemble all gestures into a map, for easy look up
            gestures.forEach(function (gesture) {
                gestureMap[gesture.key] = gestureMap[gesture.key] || gesture;
            });

            this.gestureMap = gestureMap;
        }

        function releaseGesture(gesture) {
            // Invoke the gesture's "destroy" method (if there is one)
            // to release any held resources and detach event handlers.
            if (gesture && gesture.destroy) {
                gesture.destroy();
            }
        }

        GestureProvider.prototype.attachGestures = function attachGestures(element, domainObject, gestureKeys) {
            // Look up the desired gestures, filter for applicability,
            // and instantiate them. Maintain a reference to allow them
            // to be destroyed as a group later.
            var gestureMap = this.gestureMap,
                attachedGestures = gestureKeys.map(function (key) {
                    return gestureMap[key];
                }).filter(function (Gesture) {
                    return Gesture !== undefined && (Gesture.appliesTo
                        ? Gesture.appliesTo(domainObject)
                        : true);
                }).map(function (Gesture) {
                    return new Gesture(element, domainObject);
                });

            return {
                destroy: function () {
                    // Just call all the individual "destroy" methods
                    attachedGestures.forEach(releaseGesture);
                }
            };
        };

        /**
         * A destroyable object may have resources allocated which require
         * explicit release.
         *
         * @interface Destroyable
         */
        /**
         * Release any resources associated with this object.
         *
         * @method Destroyable#destroy
         */

        /**
         * A gesture describes manners in which certain representations of
         * domain objects may respond to DOM events upon those representations.
         * @interface Gesture
         * @augments Destroyable
         */

        return GestureProvider;
    }
);
