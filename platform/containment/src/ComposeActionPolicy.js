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
         * Restrict `compose` actions to cases where composition
         * is explicitly allowed.
         *
         * Note that this is a policy that needs the `policyService`,
         * since it's delegated to a different policy category.
         * To avoid a circular dependency, the service is obtained via
         * Angular's `$injector`.
         * @constructor
         * @memberof platform/containment
         * @implements {Policy.<Action, ActionContext>}
         */
        function ComposeActionPolicy($injector, openmct) {
            this.getPolicyService = function () {
                return $injector.get('policyService');
            };

            this.openmct = openmct;
        }

        ComposeActionPolicy.prototype.allowComposition = function (containerObject, selectedObject) {

            // Get a reference to the policy service if needed...
            this.policyService = this.policyService || this.getPolicyService();

            // ...and delegate to the composition policy
            return containerObject.getId() !== selectedObject.getId()
                && this.openmct.composition.checkPolicy(containerObject.useCapability('adapter'),
                    selectedObject.useCapability('adapter'));
        };

        /**
         * Check whether or not a compose action should be allowed
         * in this context.
         * @returns {boolean} true if it may be allowed
         * @memberof platform/containment.ComposeActionPolicy#
         */
        ComposeActionPolicy.prototype.allow = function (candidate, context) {
            if (candidate.getMetadata().key === 'compose') {
                return this.allowComposition(
                    (context || {}).domainObject,
                    (context || {}).selectedObject
                );
            }

            return true;
        };

        return ComposeActionPolicy;

    }
);
