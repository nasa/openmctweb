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
    ["uuid", "./Identifier"],
    function (uuid, Identifier) {

        /**
         * Parses and generates domain object identifiers.
         * @param {string} defaultSpace the default persistence space
         * @constructor
         * @memberof {platform/core}
         */
        function IdentifierProvider(defaultSpace) {
            this.defaultSpace = defaultSpace;
        }

        /**
         * Generate a new domain object identifier. A persistence space
         * may optionally be included; if not specified, no space will
         * be encoded into the identifier.
         * @param {string} [space] the persistence space to encode
         *        in this identifier
         * @returns {string} a new domain object identifier
         */
        IdentifierProvider.prototype.generate = function (space) {
            var id = uuid();
            if (space !== undefined) {
                id = space + ":" + id;
            }

            return id;
        };

        /**
         * Parse a domain object identifier to examine its component
         * parts (e.g. its persistence space.)
         * @returns {platform/core.Identifier} the parsed identifier
         */
        IdentifierProvider.prototype.parse = function (id) {
            return new Identifier(id, this.defaultSpace);
        };

        return IdentifierProvider;
    }
);
