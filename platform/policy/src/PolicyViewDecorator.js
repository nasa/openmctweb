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
         * Filters out views based on policy.
         * @param {PolicyService} policyService the service which provides
         *        policy decisions
         * @param {ViewService} viewService the service to decorate
         * @constructor
         * @memberof platform/policy
         * @implements {ViewService}
         */
        function PolicyViewDecorator(policyService, viewService) {
            this.policyService = policyService;
            this.viewService = viewService;
        }

        PolicyViewDecorator.prototype.getViews = function (domainObject) {
            var policyService = this.policyService;

            // Check if an action is allowed by policy.
            function allow(view) {
                return policyService.allow('view', view, domainObject);
            }

            // Look up actions, filter out the disallowed ones.
            return this.viewService.getViews(domainObject).filter(allow);
        };

        return PolicyViewDecorator;
    }
);
