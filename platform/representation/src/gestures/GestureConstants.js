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
 * Constants used by domain object gestures.
 * @class platform/representation.GestureConstants
 */
define({
    /**
     * The string identifier for the data type used for drag-and-drop
     * composition of domain objects. (e.g. in event.dataTransfer.setData
     * calls.)
     * @memberof platform/representation.GestureConstants
     */
    MCT_DRAG_TYPE: 'mct-domain-object-id',
    /**
     * The string identifier for the data type used for drag-and-drop
     * composition of domain objects, by object instance (passed through
     * the dndService)
     * @memberof platform/representation.GestureConstants
     */
    MCT_EXTENDED_DRAG_TYPE: 'mct-domain-object',
    /**
     * An estimate for the dimensions of a context menu, used for
     * positioning.
     * @memberof platform/representation.GestureConstants
     */
    MCT_MENU_DIMENSIONS: [170, 200],
    /**
     * Identifier for drop events.
     * @memberof platform/representation.GestureConstants
     */
    MCT_DROP_EVENT: 'mctDrop'
});
