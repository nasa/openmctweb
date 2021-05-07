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
 * Module defining DragGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {

        /**
         * Add event handlers to a representation such that it may be
         * dragged as the source for drag-drop composition.
         *
         * @memberof platform/representation
         * @constructor
         * @implements {Gesture}
         * @param $log Angular's logging service
         * @param element the jqLite-wrapped element which should become
         *        draggable
         * @param {DomainObject} domainObject the domain object which
         *        is represented; this will be passed on drop.
         */
        function DragGesture($log, dndService, element, domainObject) {
            function startDrag(e) {
                var event = (e || {}).originalEvent || e;

                $log.debug("Initiating drag");

                try {
                    // Set the data associated with the drag-drop operation
                    event.dataTransfer.effectAllowed = 'move';

                    // Support drop as plain-text (JSON); not used internally
                    event.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify({
                            id: domainObject.getId(),
                            model: domainObject.getModel()
                        })
                    );

                    // For internal use, pass the object's identifier as
                    // part of the drag
                    event.dataTransfer.setData(
                        GestureConstants.MCT_DRAG_TYPE,
                        domainObject.getId()
                    );

                    // Finally, also pass the id object instance via the
                    // dndService, allowing inspection during drag as well
                    // as retrieval of the original domain object.
                    dndService.setData(
                        GestureConstants.MCT_EXTENDED_DRAG_TYPE,
                        domainObject
                    );
                    dndService.setData(
                        GestureConstants.MCT_DRAG_TYPE,
                        domainObject.getId()
                    );

                } catch (err) {
                    // Exceptions at this point indicate that the browser
                    // do not fully support drag-and-drop (e.g. if
                    // dataTransfer is undefined)
                    $log.warn([
                        "Could not initiate drag due to ",
                        err.message
                    ].join(""));
                }

            }

            function endDrag() {
                // Clear the drag data after the drag is complete
                dndService.removeData(GestureConstants.MCT_DRAG_TYPE);
                dndService.removeData(GestureConstants.MCT_EXTENDED_DRAG_TYPE);
            }

            // Mark the element as draggable, and handle the dragstart event
            $log.debug("Attaching drag gesture");
            element.attr('draggable', 'true');
            element.on('dragstart', startDrag);
            element.on('dragend', endDrag);

            this.element = element;
            this.startDragCallback = startDrag;
            this.endDragCallback = endDrag;
        }

        DragGesture.prototype.destroy = function () {
            // Detach listener
            this.element.removeAttr('draggable');
            this.element.off('dragstart', this.startDragCallback);
            this.element.off('dragend', this.endDragCallback);
        };

        return DragGesture;
    }
);
