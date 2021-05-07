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
 * Module defining DropGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {

        /**
         * A DropGesture adds and maintains event handlers upon an element
         * such that it may act as a drop target for drag-drop composition.
         *
         * @memberof platform/representation
         * @constructor
         * @param $q Angular's $q, for promise handling
         * @param element the jqLite-wrapped representation element
         * @param {DomainObject} domainObject the domain object whose
         *        composition should be modified as a result of the drop.
         */
        function DropGesture(dndService, $q, element, domainObject) {
            var actionCapability = domainObject.getCapability('action'),
                action; // Action for the drop, when it occurs

            function broadcastDrop(id, event) {
                // Find the relevant scope...
                var rect,
                    scope = element.scope && element.scope();

                if (scope && scope.$broadcast) {
                    // Get the representation's bounds, to convert
                    // drop position
                    rect = element[0].getBoundingClientRect();

                    // ...and broadcast the event. This allows specific
                    // views to have post-drop behavior which depends on
                    // drop position.
                    scope.$broadcast(
                        GestureConstants.MCT_DROP_EVENT,
                        id,
                        {
                            x: event.pageX - rect.left,
                            y: event.pageY - rect.top
                        }
                    );
                }
            }

            function dragOver(e) {
                var event = (e || {}).originalEvent || e,
                    selectedObject = dndService.getData(
                        GestureConstants.MCT_EXTENDED_DRAG_TYPE
                    );

                if (selectedObject) {
                    // TODO: Vary this based on modifier keys
                    action = actionCapability.getActions({
                        key: 'compose',
                        selectedObject: selectedObject
                    })[0];
                    if (action) {
                        event.dataTransfer.dropEffect = 'move';

                        // Indicate that we will accept the drag
                        event.preventDefault(); // Required in Chrome?

                        return false;
                    }
                }
            }

            function drop(e) {
                var event = (e || {}).originalEvent || e,
                    id = event.dataTransfer.getData(GestureConstants.MCT_DRAG_TYPE);

                // Handle the drop; add the dropped identifier to the
                // destination domain object's composition, and persist
                // the change.
                if (id) {
                    e.preventDefault();
                    $q.when(action && action.perform()).then(function () {
                        broadcastDrop(id, event);
                    });

                }
            }

            // We can only handle drops if we have access to actions...
            if (actionCapability) {
                // Listen for dragover,  to indicate we'll accept a drag
                element.on('dragover', dragOver);

                // Listen for the drop itself
                element.on('drop', drop);
            }

            this.element = element;
            this.dragOverCallback = dragOver;
            this.dropCallback = drop;
        }

        DropGesture.prototype.destroy = function () {
            this.element.off('dragover', this.dragOverCallback);
            this.element.off('drop', this.dropCallback);
        };

        return DropGesture;
    }
);
