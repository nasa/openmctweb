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
         * A ToggleController is used to activate/deactivate things.
         * A common usage is for "twistie"
         *
         * @memberof platform/commonUI/general
         * @constructor
         */
        function ToggleController() {
            this.state = false;

            this.setState = this.setState.bind(this);
        }

        /**
         * Get the current state of the toggle.
         * @return {boolean} true if active
         */
        ToggleController.prototype.isActive = function () {
            return this.state;
        };

        /**
         * Set a new state for the toggle.
         * @return {boolean} true to activate
         */
        ToggleController.prototype.setState = function (newState) {
            this.state = newState;
        };

        /**
         * Toggle the current state; activate if it is inactive,
         * deactivate if it is active.
         */
        ToggleController.prototype.toggle = function () {
            this.state = !this.state;
        };

        return ToggleController;
    }
);
