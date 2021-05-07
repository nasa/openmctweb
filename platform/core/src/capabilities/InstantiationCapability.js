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
    ['./ContextualDomainObject'],
    function (ContextualDomainObject) {

        /**
         * Implements the `instantiation` capability. This allows new domain
         * objects to be instantiated.
         *
         * @constructor
         * @memberof platform/core
         * @param $injector Angular's `$injector`
         * @implements {Capability}
         */
        function InstantiationCapability(
            $injector,
            identifierService,
            now,
            domainObject
        ) {
            this.$injector = $injector;
            this.identifierService = identifierService;
            this.domainObject = domainObject;
            this.now = now;
        }

        /**
         * Instantiate a new domain object with the provided model.
         *
         * This domain object will have been simply instantiated; it will not
         * have been persisted, nor will it have been added to the
         * composition of the object which exposed this capability.
         *
         * @param {object} the model for the new domain object
         * @returns {DomainObject} the new domain object
         */
        InstantiationCapability.prototype.instantiate = function (model) {
            var parsedId =
                    this.identifierService.parse(this.domainObject.getId()),
                space = parsedId.getDefinedSpace(),
                id = this.identifierService.generate(space);

            model.modified = this.now();

            // Lazily initialize; instantiate depends on capabilityService,
            // which depends on all capabilities, including this one.
            this.instantiateFn = this.instantiateFn
                || this.$injector.get("instantiate");

            var newObject = this.instantiateFn(model, id);

            return new ContextualDomainObject(newObject, this.domainObject);
        };

        /**
         * Alias of `instantiate`.
         * @see {platform/core.CreationCapability#instantiate}
         */
        InstantiationCapability.prototype.invoke =
            InstantiationCapability.prototype.instantiate;

        return InstantiationCapability;
    }
);
