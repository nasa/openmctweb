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
    ['./TypeProperty'],
    function (TypeProperty) {

        /**
         * Describes a type of domain object.
         *
         * @interface Type
         */

        /**
         * Get the string key which identifies this type.
         * This is the type's machine-readable name/identifier,
         * and will correspond to the "type" field of the models
         * of domain objects of this type.
         *
         * @returns {string} the key which identifies this type
         * @method Type#getKey
         */
        /**
         * Get the human-readable name for this type, as should
         * be displayed in the user interface when referencing
         * this type.
         *
         * @returns {string} the human-readable name of this type
         * @method Type#getName
         */
        /**
         * Get the human-readable description for this type, as should
         * be displayed in the user interface when describing
         * this type.
         *
         * @returns {string} the human-readable description of this type
         * @method Type#getDescription
         */
        /**
         * Get the cssClass associated with this type. cssClass is a
         * string which will appear as an icon (when
         * displayed in an appropriate font) which visually
         * distinguish types from one another.
         *
         * @returns {string} the cssClass for this type
         * @method Type#getCssClass
         */
        /**
         * Get an array of properties associated with objects of
         * this type, as might be shown in a Create wizard or
         * an Edit Properties view.
         *
         * @return {TypeProperty[]} properties associated with
         *         objects of this type
         * @method Type#getPropertiees
         */
        /**
         * Get the initial state of a model for domain objects of
         * this type.
         *
         * @return {object} initial domain object model
         * @method Type#getInitialModel
         */
        /**
         * Get the raw type definition for this type. This is an
         * object containing key-value pairs of type metadata;
         * this allows the retrieval and use of custom type
         * properties which are not recognized within this interface.
         *
         * @returns {object} the raw definition for this type
         * @method Type#getDefinition
         */
        /**
         * Check if this type is or inherits from some other type.
         *
         * @param {string|Type} key either
         *        a string key for a type, or an instance of a type
         *        object, which this
         * @returns {boolean} true
         * @method Type#instanceOf
         */
        /**
         * Check if a type should support a given feature. This simply
         * checks for the presence or absence of the feature key in
         * the type definition's "feature" field.
         * @param {string} feature a string identifying the feature
         * @returns {boolean} true if the feature is supported
         * @method Type#hasFeature
         */

        /**
         * Construct a new type. Types describe categories of
         * domain objects.
         *
         * @implements {Type}
         * @param {TypeDefinition} typeDef an object containing
         *        key-value pairs describing a type and its
         *        relationship to other types.
         * @constructor
         * @memberof platform/core
         */
        function TypeImpl(typeDef) {
            var inheritList = typeDef.inherits || [],
                featureSet = {};

            (typeDef.features || []).forEach(function (feature) {
                featureSet[feature] = true;
            });

            this.typeDef = typeDef;
            this.featureSet = featureSet;
            this.inheritList = inheritList;
        }

        TypeImpl.prototype.getKey = function () {
            return this.typeDef.key;
        };

        TypeImpl.prototype.getName = function () {
            return this.typeDef.name;
        };

        TypeImpl.prototype.getDescription = function () {
            return this.typeDef.description;
        };

        TypeImpl.prototype.getCssClass = function () {
            return this.typeDef.cssClass;
        };

        TypeImpl.prototype.getProperties = function () {
            return (this.typeDef.properties || []).map(function (propertyDef) {
                return new TypeProperty(propertyDef);
            });
        };

        /**
         * Returns the default model for an object of this type. Note that
         * this method returns a clone of the original model, so if using this
         * method heavily, consider caching the result to optimize performance.
         *
         * @return {object} The default model for an object of this type.
         */
        TypeImpl.prototype.getInitialModel = function () {
            return JSON.parse(JSON.stringify(this.typeDef.model || {}));
        };

        TypeImpl.prototype.getDefinition = function () {
            return this.typeDef;
        };

        TypeImpl.prototype.instanceOf = function instanceOf(key) {
            var typeDef = this.typeDef,
                inheritList = this.inheritList;

            if (key === typeDef.key) {
                return true;
            } else if (inheritList.indexOf(key) > -1) {
                return true;
            } else if (!key) {
                return true;
            } else if (key !== null && typeof key === 'object') {
                return key.getKey ? this.instanceOf(key.getKey()) : false;
            } else {
                return false;
            }
        };

        TypeImpl.prototype.hasFeature = function (feature) {
            return this.featureSet[feature] || false;
        };

        return TypeImpl;
    }
);
