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

define([
    './synchronizeMutationCapability',
    './AlternateCompositionCapability',
    './patchViewCapability'
], function (
    synchronizeMutationCapability,
    AlternateCompositionCapability,
    patchViewCapability
) {

    /**
     * Overrides certain capabilities to keep consistency between old API
     * and new API.
     */
    function APICapabilityDecorator($injector, capabilityService) {
        this.$injector = $injector;
        this.capabilityService = capabilityService;
    }

    APICapabilityDecorator.prototype.getCapabilities = function (
        model,
        id
    ) {
        const capabilities = this.capabilityService.getCapabilities(model, id);
        if (capabilities.mutation) {
            capabilities.mutation =
                synchronizeMutationCapability(capabilities.mutation);
        }

        if (capabilities.view) {
            capabilities.view = patchViewCapability(capabilities.view);
        }

        if (AlternateCompositionCapability.appliesTo(model, id)) {
            capabilities.composition = function (domainObject) {
                return new AlternateCompositionCapability(this.$injector, domainObject);
            }.bind(this);
        }

        return capabilities;
    };

    return APICapabilityDecorator;

});
