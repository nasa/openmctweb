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

        var SEPARATOR = ":";

        /**
         * Provides an interface for interpreting domain object identifiers;
         * in particular, parses out persistence space/key pairs associated
         * with the domain object.
         *
         * @memberof platform/core
         * @constructor
         * @param {string} id the domain object identifier
         * @param {string} defaultSpace the persistence space to use if
         *        one is not encoded in the identifier
         */
        function Identifier(id, defaultSpace) {
            var separatorIndex = id.indexOf(SEPARATOR);

            if (separatorIndex > -1) {
                this.key = id.substring(separatorIndex + 1);
                this.space = id.substring(0, separatorIndex);
                this.definedSpace = this.space;
            } else {
                this.key = id;
                this.space = defaultSpace;
                this.definedSpace = undefined;
            }
        }

        /**
         * Get the key under which the identified domain object's model
         * should be persisted, within its persistence space.
         * @returns {string} the key within its persistence space
         */
        Identifier.prototype.getKey = function () {
            return this.key;
        };

        /**
         * Get the space in which the identified domain object's model should
         * be persisted.
         * @returns {string} the persistence space
         */
        Identifier.prototype.getSpace = function () {
            return this.space;
        };

        /**
         * Get the persistence space, if any, which has been explicitly
         * encoded in this domain object's identifier. Returns undefined
         * if no such space has been specified.
         * @returns {string} the persistence space, or undefined
         */
        Identifier.prototype.getDefinedSpace = function () {
            return this.definedSpace;
        };

        return Identifier;
    }
);
