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
         * The CompositeController supports the "composite" control type,
         * which provides an array of other controls. It is used specifically
         * to support validation when a particular row is not marked as
         * required; in this case, empty input should be allowed, but partial
         * input (where some but not all of the composite controls have been
         * filled in) should be disallowed. This is enforced in the template
         * by an ng-required directive, but that is supported by the
         * isNonEmpty check that this controller provides.
         * @memberof platform/forms
         * @constructor
         */
        function CompositeController() {
        }

        // Check if an element is defined; the map step of isNonEmpty
        function isDefined(element) {
            return typeof element !== 'undefined';
        }

        /**
         * Check if an array contains anything other than
         * undefined elements.
         * @param {Array} value the array to check
         * @returns {boolean} true if any non-undefined
         *          element is in the array
         * @memberof platform/forms.CompositeController#
         */
        CompositeController.prototype.isNonEmpty = function (value) {
            return Array.isArray(value) && value.some(isDefined);
        };

        return CompositeController;

    }
);
