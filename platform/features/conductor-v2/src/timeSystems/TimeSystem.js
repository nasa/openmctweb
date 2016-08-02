/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([], function () {
    /**
     * @interface
     * @constructor
     */
    function TimeSystem () {
        /**
         * @typedef TimeSystemMetadata
         * @property {string} key
         * @property {string} name
         * @property {string} description
         *
         * @type {TimeSystemMetadata}
         */
        this.metadata = undefined;
        this._tickSources = [];
    }

    /**
     * Time formats are defined as extensions. Time systems that implement
     * this interface should provide an array of format keys supported by them.
     *
     * @returns {string[]} An array of time format keys
     */
    TimeSystem.prototype.formats = function () {
        throw new Error('Not implemented');
    };

    /**
     * Returns the tick sources supported by this time system. Tick sources
     * are event generators that can be used to advance the time conductor
     * @returns {TickSource[]} The tick sources supported by this time system.
     */
    TimeSystem.prototype.tickSources = function () {
        throw new Error('Not implemented');
    };

    /**
     *
     * @returns {TimeSystemDefault[]} At least one set of default values for
     * this time system.
     */
    TimeSystem.prototype.defaults = function () {
        throw new Error('Not implemented');
    };

    return TimeSystem;
});
