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

define(['./Type'], function (Type) {
    /**
     * @typedef TypeDefinition
     * @memberof module:openmct.TypeRegistry~
     * @property {string} label the name for this type of object
     * @property {string} description a longer-form description of this type
     * @property {function (object)} [initialize] a function which initializes
     *           the model for new domain objects of this type
     * @property {boolean} [creatable] true if users should be allowed to
     *           create this type (default: false)
     * @property {string} [cssClass] the CSS class to apply for icons
     */

    /**
     * A TypeRegistry maintains the definitions for different types
     * that domain objects may have.
     * @interface TypeRegistry
     * @memberof module:openmct
     */
    function TypeRegistry() {
        this.types = {};
    }

    /**
     * Register a new object type.
     *
     * @param {string} typeKey a string identifier for this type
     * @param {module:openmct.Type} type the type to add
     * @method addType
     * @memberof module:openmct.TypeRegistry#
     */
    TypeRegistry.prototype.addType = function (typeKey, typeDef) {
        this.standardizeType(typeDef);
        this.types[typeKey] = new Type(typeDef);
    };

    /**
     * Takes a typeDef, standardizes it, and logs warnings about unsupported
     * usage.
     * @private
     */
    TypeRegistry.prototype.standardizeType = function (typeDef) {
        if (Object.prototype.hasOwnProperty.call(typeDef, 'label')) {
            console.warn(
                'DEPRECATION WARNING typeDef: ' + typeDef.label + '.  '
                + '`label` is deprecated in type definitions.  Please use '
                + '`name` instead.  This will cause errors in a future version '
                + 'of Open MCT.  For more information, see '
                + 'https://github.com/nasa/openmct/issues/1568');
            if (!typeDef.name) {
                typeDef.name = typeDef.label;
            }

            delete typeDef.label;
        }
    };

    /**
     * List keys for all registered types.
     * @method listKeys
     * @memberof module:openmct.TypeRegistry#
     * @returns {string[]} all registered type keys
     */
    TypeRegistry.prototype.listKeys = function () {
        return Object.keys(this.types);
    };

    /**
     * Retrieve a registered type by its key.
     * @method get
     * @param {string} typeKey the key for this type
     * @memberof module:openmct.TypeRegistry#
     * @returns {module:openmct.Type} the registered type
     */
    TypeRegistry.prototype.get = function (typeKey) {
        return this.types[typeKey];
    };

    TypeRegistry.prototype.importLegacyTypes = function (types) {
        types.filter((t) => !this.get(t.key))
            .forEach((type) => {
                let def = Type.definitionFromLegacyDefinition(type);
                this.addType(type.key, def);
            });
    };

    return TypeRegistry;
});

