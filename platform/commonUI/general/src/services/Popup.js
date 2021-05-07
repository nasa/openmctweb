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
    function () {

        /**
         * A popup is an element that has been displayed at a particular
         * location within the page.
         * @constructor
         * @memberof platform/commonUI/general
         * @param element the jqLite-wrapped element
         * @param {object} styles an object containing key-value pairs
         *        of styles used to position the element.
         */
        function Popup(element, styles) {
            this.styles = styles;
            this.element = element;

            element.css(styles);
        }

        /**
         * Stop showing this popup.
         */
        Popup.prototype.dismiss = function () {
            this.element.remove();
        };

        /**
         * Check if this popup is positioned such that it appears to the
         * left of its original location.
         * @returns {boolean} true if the popup goes left
         */
        Popup.prototype.goesLeft = function () {
            return !this.styles.left;
        };

        /**
         * Check if this popup is positioned such that it appears to the
         * right of its original location.
         * @returns {boolean} true if the popup goes right
         */
        Popup.prototype.goesRight = function () {
            return !this.styles.right;
        };

        /**
         * Check if this popup is positioned such that it appears above
         * its original location.
         * @returns {boolean} true if the popup goes up
         */
        Popup.prototype.goesUp = function () {
            return !this.styles.top;
        };

        /**
         * Check if this popup is positioned such that it appears below
         * its original location.
         * @returns {boolean} true if the popup goes down
         */
        Popup.prototype.goesDown = function () {
            return !this.styles.bottom;
        };

        return Popup;
    }
);
