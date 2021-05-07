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
 * This bundle implements the policy service.
 * @namespace platform/policy
 */
define(
    [],
    function () {

        /**
         * A policy is a participant in decision-making policies. Policies
         * are divided into categories (identified symbolically by strings);
         * within a given category, every given policy-driven decision will
         * occur by consulting all available policies and requiring their
         * collective consent (that is, every individual policy has the
         * power to reject the decision entirely.)
         *
         * @interface Policy
         * @template C, X
         */

        /**
         * Check if this policy allows the described decision. The types
         * of the arguments expected here vary depending on policy category.
         *
         * @method Policy#allow
         * @template C, X
         * @param {C} candidate the thing to allow or disallow
         * @param {X} context the context in which the decision occurs
         * @returns {boolean} false if disallowed; otherwise, true
         */

        /**
         * The `policyService` handles decisions about what things
         * are and are not allowed in certain contexts.
         * @interface PolicyService
         */

        /**
         * Check whether or not a certain decision is allowed by
         * policy.
         * @param {string} category a machine-readable identifier
         *        for the kind of decision being made
         * @param candidate the object about which the decision is
         *        being made
         * @param context the context in which the decision occurs
         * @param {Function} [callback] callback to invoke with a
         *        string message describing the reason a decision
         *        was disallowed (if its disallowed)
         * @returns {boolean} true if the decision is allowed,
         *          otherwise false.
         * @method PolicyService#allow
         */

        /**
         * Provides an implementation of `policyService` which consults
         * various policy extensions to determine whether or not a specific
         * decision should be allowed.
         * @memberof platform/policy
         * @constructor
         * @implements {PolicyService}
         * @param {Policy[]} policies the policies to enforce
         */
        function PolicyProvider(policies) {
            var policyMap = {};

            // Instantiate a policy. Mostly just a constructor call, but
            // we also track the message (which was provided as metadata
            // along with the constructor) so that we can expose this later.
            function instantiate(Policy) {
                var policy = Object.create(new Policy());
                policy.message = Policy.message;

                return policy;
            }

            // Add a specific policy to the map for later lookup,
            // according to its category. Note that policy extensions are
            // provided as constructors, so they are instantiated here.
            function addToMap(Policy) {
                var category = (Policy || {}).category;
                if (category) {
                    // Create a new list for that category if needed...
                    policyMap[category] = policyMap[category] || [];
                    // ...and put an instance of this policy in that list.
                    policyMap[category].push(instantiate(Policy));
                }
            }

            // Populate the map for subsequent lookup
            policies.forEach(addToMap);
            this.policyMap = policyMap;
        }

        PolicyProvider.prototype.allow = function (category, candidate, context, callback) {
            var policyList = this.policyMap[category] || [],
                i;

            // Iterate through policies. We do this instead of map or
            // forEach so that we can return immediately if a policy
            // chooses to disallow this decision.
            for (i = 0; i < policyList.length; i += 1) {
                // Consult the policy...
                if (!policyList[i].allow(candidate, context)) {
                    // ...it disallowed, so pass its message to
                    // the callback (if any)
                    if (callback) {
                        callback(policyList[i].message);
                    }

                    // And return the failed result.
                    return false;
                }
            }

            // No policy disallowed this decision.
            return true;
        };

        return PolicyProvider;
    }
);
