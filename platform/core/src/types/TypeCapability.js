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
 * Module defining TypeCapability. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {

        /**
         * The `type` capability makes information about a domain object's
         * type directly available when working with that object, by way
         * of a `domainObject.getCapability('type')` invocation.
         *
         * @memberof platform/core
         * @constructor
         * @augments {Type}
         * @implements {Capability}
         * @param {TypeService} typeService the service which
         *        provides type information
         * @param {DomainObject} domainObject the domain object
         *        which exposes the type capability
         */
        function TypeCapability(typeService, domainObject) {
            var typeKey = domainObject.getModel().type,
                type = typeService.getType(typeKey);

            // Simply return the type, but wrap with Object.create
            // to avoid exposing the type object directly.
            return Object.create(type);
        }

        return TypeCapability;
    }
);
