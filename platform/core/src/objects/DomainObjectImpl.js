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
 * Module defining DomainObject. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {

        /**
         * A domain object is an entity of interest to the user.
         *
         * @interface DomainObject
         */

        /**
         * Get the unique identifier for this domain object.
         *
         * @method DomainObject#getId
         * @return {string} the domain object's unique identifier
         */

        /**
         * Get the domain object's model. This is useful to
         * directly look up known properties of an object, but
         * direct modification of a returned model is generally
         * discouraged and may result in errors. Instead, an
         * object's `mutation` capability should be used.
         *
         * @method DomainObject#getModel
         * @return {object} the domain object's persistent state
         */

        /**
         * Get a capability associated with this object.
         * Capabilities are looked up by string identifiers;
         * prior knowledge of a capability's interface is
         * necessary.
         *
         * @method DomainObject#getCapability
         * @param {string} key the identifier for the capability
         * @return {Capability} the named capability, or undefined
         *         if not present.
         */

        /**
         * Check if this domain object supports a capability
         * with the provided name.
         *
         * @method DomainObject#hasCapability
         * @param {string} key the identifier for the capability
         * @return {boolean} true if this domain object has this capability
         */

        /**
         * Use a capability of an object; the behavior of this method
         * depends on the interface of the capability, and whether
         * or not it is present.
         *
         * * If the capability is not present for this object,
         *   no operation occurs.
         * * If the capability is present and has an `invoke` method,
         *   that method is called with any additional arguments
         *   provided, and its return value is returned.
         * * If the capability is present but has no `invoke` method,
         *   this capability itself is returned.
         *
         * @method DomainObject#useCapability
         * @param {string} name the name of the capability to invoke
         * @param {...*} [arguments] to pass to the invocation
         * @returns {*|Capability} the result of invocation (see description)
         */

        /**
         * Construct a new domain object with the specified
         * identifier, model, and capabilities.
         *
         * @param {string} id the object's unique identifier
         * @param {object} model the "JSONifiable" state of the object
         * @param {Object.<string, Capability>|function} capabilities all
         *        capabilities to be exposed by this object
         * @memberof platform/core
         * @constructor
         */
        function DomainObjectImpl(id, model, capabilities) {
            this.id = id;
            this.model = model;
            this.capabilities = capabilities;
        }

        DomainObjectImpl.prototype.getId = function () {
            return this.id;
        };

        DomainObjectImpl.prototype.getModel = function () {
            return this.model;
        };

        DomainObjectImpl.prototype.getCapability = function (name) {
            var capability = this.capabilities[name];

            return typeof capability === 'function'
                ? capability(this) : capability;
        };

        DomainObjectImpl.prototype.hasCapability = function (name) {
            return this.getCapability(name) !== undefined;
        };

        DomainObjectImpl.prototype.useCapability = function (name) {
            // Get tail of args to pass to invoke
            var args = Array.prototype.slice.apply(arguments, [1]),
                capability = this.getCapability(name);

            return (capability && capability.invoke)
                ? capability.invoke.apply(capability, args)
                : capability;
        };

        return DomainObjectImpl;
    }
);
