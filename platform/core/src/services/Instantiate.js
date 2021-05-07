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
    ['../objects/DomainObjectImpl'],
    function (DomainObjectImpl) {

        /**
         * The `instantiate` service allows new domain object instances to be
         * created. These objects are not persisted to any back-end or
         * placed anywhere in the object hierarchy by default.
         *
         * Usage: `instantiate(model, [id])`
         *
         * ...returns a new instance of a domain object with the specified
         * model. An identifier may be provided; if omitted, one will be
         * generated instead.
         *
         * @constructor
         * @memberof platform/core
         * @param {CapabilityService} capabilityService the service which will
         *        provide instantiated domain objects with their capabilities
         * @param {IdentifierService} identifierService service to generate
         *        new identifiers
         */
        function Instantiate(
            capabilityService,
            identifierService,
            cacheService
        ) {
            return function (model, id) {
                var capabilities = capabilityService.getCapabilities(model);
                id = id || identifierService.generate();
                cacheService.put(id, model);

                return new DomainObjectImpl(id, model, capabilities);
            };
        }

        return Instantiate;
    }
);
