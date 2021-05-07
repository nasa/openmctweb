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

define([], function () {

    /**
     * Provides a cache for domain object models which exist in memory,
     * but may or may not exist in backing persistence stores.
     * @constructor
     * @memberof platform/core
     */
    function ModelCacheService() {
        this.cache = {};
    }

    /**
     * Put a domain object model in the cache.
     * @param {string} id the domain object's identifier
     * @param {object} model the domain object's model
     */
    ModelCacheService.prototype.put = function (id, model) {
        this.cache[id] = model;
    };

    /**
     * Retrieve a domain object model from the cache.
     * @param {string} id the domain object's identifier
     * @returns {object} the domain object's model
     */
    ModelCacheService.prototype.get = function (id) {
        return this.cache[id];
    };

    /**
     * Check if a domain object model is in the cache.
     * @param {string} id the domain object's identifier
     * @returns {boolean} true if present; false if not
     */
    ModelCacheService.prototype.has = function (id) {
        return Object.prototype.hasOwnProperty.call(this.cache, id);
    };

    /**
     * Remove a domain object model from the cache.
     * @param {string} id the domain object's identifier
     */
    ModelCacheService.prototype.remove = function (id) {
        delete this.cache[id];
    };

    /**
     * Retrieve all cached domain object models. These are given
     * as an object containing key-value pairs, where keys are
     * domain object identifiers and values are domain object models.
     * @returns {object} all domain object models
     */
    ModelCacheService.prototype.all = function () {
        return this.cache;
    };

    ModelCacheService.prototype.flush = function () {
        this.cache = {};
    };

    return ModelCacheService;
});
