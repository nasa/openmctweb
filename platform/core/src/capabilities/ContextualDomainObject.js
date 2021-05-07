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
 * Module defining ContextualDomainObject. Created by vwoeltje on 11/18/14.
 */
define(
    ["./ContextCapability"],
    function (ContextCapability) {

        /**
         * Wraps a domain object, such that it exposes a `context` capability.
         * A domain object may be contained by multiple other domain objects;
         * the `context` capability allows two instances of the same domain
         * object to be distinguished from one another based on which
         * specific instance of a containing object exposed them (by way of a
         * `composition` capability.)
         *
         * @param {DomainObject} domainObject the domain object for which
         *        context should be exposed
         * @param {DomainObject} parentObject the domain object from which
         *        the wrapped object was retrieved
         *
         * @memberof platform/core
         * @constructor
         * @implements {DomainObject}
         */
        function ContextualDomainObject(domainObject, parentObject) {
            // Prototypally inherit from the domain object, and
            // instantiate its context capability ahead of time.
            var contextualObject = Object.create(domainObject),
                contextCapability =
                    new ContextCapability(parentObject, domainObject);

            // Intercept requests for a context capability.
            contextualObject.getCapability = function (name) {
                return name === "context"
                    ? contextCapability
                    : domainObject.getCapability.apply(this, arguments);
            };

            return contextualObject;
        }

        return ContextualDomainObject;
    }
);
