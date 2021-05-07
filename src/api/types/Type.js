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

define(function () {

    /**
     * A Type describes a kind of domain object that may appear or be
     * created within Open MCT.
     *
     * @param {module:opemct.TypeRegistry~TypeDefinition} definition
     * @class Type
     * @memberof module:openmct
     */
    function Type(definition) {
        this.definition = definition;
        if (definition.key) {
            this.key = definition.key;
        }
    }

    /**
     * Check if a domain object is an instance of this type.
     * @param domainObject
     * @returns {boolean} true if the domain object is of this type
     * @memberof module:openmct.Type#
     * @method check
     */
    Type.prototype.check = function (domainObject) {
        // Depends on assignment from MCT.
        return domainObject.type === this.key;
    };

    /**
     * Get a definition for this type that can be registered using the
     * legacy bundle format.
     * @private
     */
    Type.prototype.toLegacyDefinition = function () {
        const def = {};
        def.name = this.definition.name;
        def.cssClass = this.definition.cssClass;
        def.description = this.definition.description;
        def.properties = this.definition.form;

        if (this.definition.initialize) {
            def.model = {};
            this.definition.initialize(def.model);
        }

        if (this.definition.creatable) {
            def.features = ['creation'];
        }

        return def;
    };

    /**
     * Create a type definition from a legacy definition.
     */
    Type.definitionFromLegacyDefinition = function (legacyDefinition) {
        let definition = {};
        definition.name = legacyDefinition.name;
        definition.cssClass = legacyDefinition.cssClass;
        definition.description = legacyDefinition.description;
        definition.form = legacyDefinition.properties;
        if (legacyDefinition.model) {
            definition.initialize = function (model) {
                for (let [k, v] of Object.entries(legacyDefinition.model)) {
                    model[k] = JSON.parse(JSON.stringify(v));
                }
            };
        }

        if (legacyDefinition.features && legacyDefinition.features.includes("creation")) {
            definition.creatable = true;
        }

        return definition;
    };

    return Type;
});
