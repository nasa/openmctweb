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
 * This bundle implements "containment" rules, which determine which objects
 * can be contained within which other objects.
 * @namespace platform/containment
 */
define(
    [],
    function () {

        /**
         * Determines whether a given object can contain a candidate child object.
         * @constructor
         * @memberof platform/containment
         * @implements {Policy.<DomainObjectImpl, DomainObjectImpl>}
         */
        function CompositionPolicy() {
        }

        CompositionPolicy.prototype.allow = function (parent, child) {
            var parentDef = parent.getCapability('type').getDefinition();

            // A parent without containment rules can contain anything.
            if (!parentDef.contains) {
                return true;
            }

            // If any containment rule matches context type, the candidate
            // can contain this type.
            return parentDef.contains.some(function (c) {
                // Simple containment rules are supported typeKeys.
                if (typeof c === 'string') {
                    return c === child.getCapability('type').getKey();
                }

                // More complicated rules require context to have all specified
                // capabilities.
                if (!Array.isArray(c.has)) {
                    c.has = [c.has];
                }

                return c.has.every(function (capability) {
                    return child.hasCapability(capability);
                });
            });
        };

        return CompositionPolicy;
    }
);
