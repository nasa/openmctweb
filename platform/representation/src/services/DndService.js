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
         * Drag-and-drop service.
         * Supplements HTML5 drag-and-drop support by:
         * * Storing arbitrary JavaScript objects (not just strings.)
         * * Allowing inspection of dragged objects during `dragover` events,
         *   etc. (which cannot be done in Chrome for security reasons)
         * @memberof platform/representation
         * @constructor
         * @param $log Angular's $log service
         */
        function DndService($log) {
            var data = {};

            return {
                /**
                 * Set drag data associated with a given type.
                 * @param {string} key the type's identiifer
                 * @param {*} value the data being dragged
                 * @memberof platform/representation.DndService#
                 */
                setData: function (key, value) {
                    $log.debug("Setting drag data for " + key);
                    data[key] = value;
                },
                /**
                 * Get drag data associated with a given type.
                 * @returns {*} the data being dragged
                 * @memberof platform/representation.DndService#
                 */
                getData: function (key) {
                    return data[key];
                },
                /**
                 * Remove data associated with active drags.
                 * @param {string} key the type to remove
                 * @memberof platform/representation.DndService#
                 */
                removeData: function (key) {
                    $log.debug("Clearing drag data for " + key);
                    delete data[key];
                }
            };
        }

        return DndService;
    }
);
