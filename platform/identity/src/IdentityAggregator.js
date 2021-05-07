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
 * Defines interfaces and common infrastructure for establishing
 * a user's identity.
 * @namespace platform/identity
 */
define(
    function () {

        /**
         * Provides information about the currently logged-in
         * user, if available.
         *
         * @interface IdentityService
         */

        /**
         * Get information about the current user. This returns a promise
         * which will resolve to metadata about the user, or undefined if
         * no information about the user is available.
         *
         * @method IdentityService#getUser
         * @returns {Promise.<IdentityMetadata>} a promise for metadata about
         *         the current user
         */

        /**
         * Metadata about a user.
         *
         * @typedef IdentityMetadata
         * @property {string} name the user's human-readable name
         * @property {string} key the user's machine-readable name
         */

        /**
         * Aggregator for multiple identity services. Exposes the first
         * defined identity provided by any provider, according to
         * priority order.
         *
         * @constructor
         * @implements {IdentityService}
         * @memberof platform/identity
         */
        function IdentityAggregator($q, providers) {
            this.providers = providers;
            this.$q = $q;
        }

        function delegateGetUser(provider) {
            return provider.getUser();
        }

        function identity(value) {
            return value;
        }

        function giveFirst(results) {
            return results.filter(identity)[0];
        }

        IdentityAggregator.prototype.getUser = function () {
            var $q = this.$q,
                promises = this.providers.map(delegateGetUser);

            return $q.all(promises).then(giveFirst);
        };

        return IdentityAggregator;
    }
);
