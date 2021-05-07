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
 * Module defining CoreCapabilityProvider. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {

        /**
         * A capability provides an interface with dealing with some
         * dynamic behavior associated with a domain object.
         * @interface Capability
         */

        /**
         * Optional; if present, will be used by `DomainObject#useCapability`
         * to simplify interaction with a specific capability. Parameters
         * and return values vary depending on capability type.
         * @method Capability#invoke
         */

        /**
         * Provides capabilities based on extension definitions,
         * matched to domain object models.
         *
         * @param {Array.<function(DomainObject) : Capability>} an array
         *        of constructor functions for capabilities, as
         *        exposed by extensions defined at the bundle level.
         *
         * @memberof platform/core
         * @constructor
         */
        function CoreCapabilityProvider(capabilities, $log) {
            // Filter by invoking the capability's appliesTo method
            function filterCapabilities(model, id) {
                return capabilities.filter(function (capability) {
                    return capability.appliesTo
                        ? capability.appliesTo(model, id)
                        : true;
                });
            }

            // Package capabilities as key-value pairs
            function packageCapabilities(caps) {
                var result = {};
                caps.forEach(function (capability) {
                    if (capability.key) {
                        result[capability.key] =
                            result[capability.key] || capability;
                    } else {
                        $log.warn("No key defined for capability; skipping.");
                    }
                });

                return result;
            }

            function getCapabilities(model, id) {
                return packageCapabilities(filterCapabilities(model, id));
            }

            return {
                /**
                 * Get all capabilities associated with a given domain
                 * object.
                 *
                 * This returns a promise for an object containing key-value
                 * pairs, where keys are capability names and values are
                 * either:
                 *
                 * * Capability instances
                 * * Capability constructors (which take a domain object
                 *   as their argument.)
                 *
                 *
                 * @param {*} model the object model
                 * @returns {Object.<string,function|Capability>} all
                 *     capabilities known to be valid for this model, as
                 *     key-value pairs
                 * @memberof platform/core.CoreCapabilityProvider#
                 */
                getCapabilities: getCapabilities
            };
        }

        return CoreCapabilityProvider;
    }
);

