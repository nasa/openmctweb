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
    function () {

        /**
         * @typedef DomainObjectConfig
         * @type {object}
         * @property {string} [name] a name for the underlying jasmine spy
         *     object mockDomainObject.  Used as
         * @property {string} [id] initial id value for the domainOBject.
         * @property {object} [model] initial values for the object's model.
         * @property {object} [capabilities] an object containing
         *     capability definitions.
         */

        var configObjectProps = ['model', 'capabilities'];

        /**
         * Internal function for ensuring an object is an instance of a
         * DomainObjectConfig.
         */
        function ensureValidConfigObject(config) {
            if (!config || !config.hasOwnProperty) {
                config = {};
            }

            if (!config.name) {
                config.name = 'domainObject';
            }

            configObjectProps.forEach(function (prop) {
                if (!config[prop] || !config[prop].hasOwnProperty) {
                    config[prop] = {};
                }
            });

            return config;
        }

        /**
         * Defines a factory function which takes a `config` object and returns
         * a mock domainObject.  The config object is an easy way to provide
         * initial properties for the domainObject-- they can be changed at any
         * time by directly modifying the domainObject's properties.
         *
         * @param {Object} [config] initial configuration for a domain object.
         * @returns {Object} mockDomainObject
         */
        function domainObjectFactory(config) {
            config = ensureValidConfigObject(config);

            var domainObject = jasmine.createSpyObj(config.name, [
                'getId',
                'getModel',
                'getCapability',
                'hasCapability',
                'useCapability'
            ]);

            domainObject.model = JSON.parse(JSON.stringify(config.model));
            domainObject.capabilities = config.capabilities;
            domainObject.id = config.id;

            /**
             * getId: Returns `domainObject.id`.
             *
             * @returns {string} id
             */
            domainObject.getId.and.callFake(function () {
                return domainObject.id;
            });

            /**
             * getModel: Returns `domainObject.model`.
             *
             * @returns {object} model
             */
            domainObject.getModel.and.callFake(function () {
                return domainObject.model;
            });

            /**
             * getCapability: returns a `capability` object defined in
             * domainObject.capabilities.  Returns undefined if capability
             * does not exist.
             *
             * @param {string} capability name of the capability to return.
             * @returns {*} capability object
             */
            domainObject.getCapability.and.callFake(function (capability) {
                if (Object.prototype.hasOwnProperty.call(config.capabilities, capability)) {
                    return config.capabilities[capability];
                }
            });

            /**
             * hasCapability: return true if domainObject.capabilities has a
             * property named `capability`, otherwise returns false.
             *
             * @param {string} capability name of the capability to test for
             *     existence of.
             * @returns {boolean}
             */
            domainObject.hasCapability.and.callFake(function (capability) {
                return Object.prototype.hasOwnProperty.call(config.capabilities, capability);
            });

            /**
             * useCapability: find a capability in domainObject.capabilities
             * and call that capabilities' invoke method.  If the capability
             * does not have an invoke method, will throw an error.
             *
             * @param {string} capability name of a capability to invoke.
             * @param {...*} params to pass to the capability's `invoke` method.
             * @returns {*} result whatever was returned by `invoke`.
             */
            domainObject.useCapability.and.callFake(function (capability) {
                if (Object.prototype.hasOwnProperty.call(config.capabilities, capability)) {
                    if (!config.capabilities[capability].invoke) {
                        throw new Error(
                            capability + ' missing invoke function.'
                        );
                    }

                    var passThroughArgs = [].slice.call(arguments, 1);

                    return config
                        .capabilities[capability]
                        .invoke
                        .apply(null, passThroughArgs);
                }
            });

            return domainObject;
        }

        return domainObjectFactory;
    }
);
