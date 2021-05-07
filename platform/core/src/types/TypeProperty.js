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
    ['./TypePropertyConversion'],
    function (TypePropertyConversion) {

        /**
         * Instantiate a property associated with domain objects of a
         * given type. This provides an interface by which
         *
         * @memberof platform/core
         * @constructor
         */
        function TypeProperty(propertyDefinition) {
            // Load an appropriate conversion
            this.conversion = new TypePropertyConversion(
                propertyDefinition.conversion || "identity"
            );
            this.propertyDefinition = propertyDefinition;
        }

        // Check if a value is defined; used to check if initial array
        // values have been populated.
        function isUnpopulatedArray(value) {
            var i;

            if (!Array.isArray(value) || value.length === 0) {
                return false;
            }

            for (i = 0; i < value.length; i += 1) {
                if (value[i] !== undefined) {
                    return false;
                }
            }

            return true;
        }

        // Specify a field deeply within an object
        function specifyValue(object, propertyPath, value) {
            // If path is not an array, just set the property
            if (!Array.isArray(propertyPath)) {
                object[propertyPath] = value;
            } else if (propertyPath.length > 1) {
                // Otherwise, look up in defined sequence
                object[propertyPath[0]] = object[propertyPath[0]] || {};
                specifyValue(
                    object[propertyPath[0]],
                    propertyPath.slice(1),
                    value
                );
            } else if (propertyPath.length === 1) {
                object[propertyPath[0]] = value;
            }
        }

        // Perform a lookup for a value from an object,
        // which may recursively look at contained objects
        // based on the path provided.
        function lookupValue(object, propertyPath) {
            var value;

            // Can't look up from a non-object
            if (!object) {
                return undefined;
            }

            // If path is not an array, just look up the property
            if (!Array.isArray(propertyPath)) {
                return object[propertyPath];
            }

            // Otherwise, look up in the sequence defined in the array
            if (propertyPath.length > 0) {
                value = object[propertyPath[0]];

                return propertyPath.length > 1
                    ? lookupValue(value, propertyPath.slice(1))
                    : value;
            }

            // Fallback; property path was empty
            return undefined;
        }

        /**
         * Retrieve the value associated with this property
         * from a given model.
         * @param {object} model a domain object model to read from
         * @returns {*} the value for this property, as read from the model
         */
        TypeProperty.prototype.getValue = function (model) {
            var property = this.propertyDefinition.property
                    || this.propertyDefinition.key,
                initialValue =
                    property && lookupValue(model, property);

            // Provide an empty array if this is a multi-item
            // property.
            if (Array.isArray(this.propertyDefinition.items)) {
                initialValue = initialValue
                    || new Array(this.propertyDefinition.items.length);
            }

            return this.conversion.toFormValue(initialValue);
        };

        /**
         * Set a value associated with this property in
         * an object's model.
         * @param {object} model a domain object model to update
         * @param {*} value the new value to set for this property
         */
        TypeProperty.prototype.setValue = function (model, value) {
            var property = this.propertyDefinition.property
                    || this.propertyDefinition.key;

            // If an array contains all undefined values, treat it
            // as undefined, to filter back out arrays for input
            // that never got entered.
            value = isUnpopulatedArray(value) ? undefined : value;

            // Convert to a value suitable for storage in the
            // domain object's model
            value = this.conversion.toModelValue(value);

            return property
                ? specifyValue(model, property, value)
                : undefined;
        };

        /**
         * Get the raw definition for this property.
         * @returns {TypePropertyDefinition}
         */
        TypeProperty.prototype.getDefinition = function () {
            return this.propertyDefinition;
        };

        return TypeProperty;
    }
);
