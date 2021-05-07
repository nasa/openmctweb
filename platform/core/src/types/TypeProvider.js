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
    ['./TypeImpl', './MergeModels'],
    function (TypeImpl, mergeModels) {

        /**
         * Provides domain object types that are available/recognized within
         * the system.
         *
         * @interface TypeService
         */
        /**
         * Get a specific type by name.
         *
         * @method TypeService#getType
         * @param {string} key the key (machine-readable identifier)
         *        for the type of interest
         * @returns {Type} the type identified by this key
         */
        /**
         * List all known types.
         *
         * @method TypeService#listTypes
         * @returns {Type[]} all known types
         */

        var TO_CONCAT = ['inherits', 'capabilities', 'properties', 'features'],
            TO_MERGE = ['model'];

        function copyKeys(a, b) {
            Object.keys(b).forEach(function (k) {
                a[k] = b[k];
            });
        }

        function removeDuplicates(array) {
            var set = {};

            return array ? array.filter(function (element) {
                // Don't filter objects (e.g. property definitions)
                if (element instanceof Object && !(element instanceof String)) {
                    return true;
                }

                return set[element]
                    ? false
                    : (set[element] = true);
            }) : array;
        }

        // Reduce an array of type definitions to a single type definition,
        // which has merged all properties in order.
        function collapse(typeDefs) {
            var collapsed = typeDefs.reduce(function (a, b) {
                var result = {};
                copyKeys(result, a);
                copyKeys(result, b);

                // Special case: Do a merge, e.g. on "model"
                TO_MERGE.forEach(function (k) {
                    if (a[k] && b[k]) {
                        result[k] = mergeModels(a[k], b[k]);
                    }
                });

                // Special case: Concatenate certain arrays
                TO_CONCAT.forEach(function (k) {
                    if (a[k] || b[k]) {
                        result[k] = (a[k] || []).concat(b[k] || []);
                    }
                });

                return result;
            }, {});

            // Remove any duplicates from the collapsed array
            TO_CONCAT.forEach(function (k) {
                if (collapsed[k]) {
                    collapsed[k] = removeDuplicates(collapsed[k]);
                }
            });

            return collapsed;
        }

        /**
         * A type provider provides information about types of domain objects
         * within the running Open MCT instance.
         *
         * @param {Array<TypeDefinition>} types the raw type
         *        definitions for this type.
         * @memberof platform/core
         * @constructor
         */
        function TypeProvider(types) {
            var rawTypeDefinitions = types,
                typeDefinitions = (function (typeDefArray) {
                    var result = {};
                    typeDefArray.forEach(function (typeDef) {
                        var k = typeDef.key;
                        if (k) {
                            result[k] = (result[k] || []).concat(typeDef);
                        }
                    });

                    return result;
                }(rawTypeDefinitions));

            this.typeMap = {};
            this.typeDefinitions = typeDefinitions;
            this.rawTypeDefinitions = types;
        }

        TypeProvider.prototype.listTypes = function () {
            var self = this;

            return removeDuplicates(
                this.rawTypeDefinitions.filter(function (def) {
                    return def.key;
                }).map(function (def) {
                    return def.key;
                }).map(function (key) {
                    return self.getType(key);
                })
            );
        };

        TypeProvider.prototype.getType = function (key) {
            var typeDefinitions = this.typeDefinitions,
                self = this;

            function getUndefinedType() {
                return (self.undefinedType = self.undefinedType || collapse(
                    self.rawTypeDefinitions.filter(function (typeDef) {
                        return !typeDef.key;
                    })
                ));
            }

            function asArray(value) {
                return Array.isArray(value) ? value : [value];
            }

            function lookupTypeDef(typeKey) {
                function buildTypeDef(typeKeyToBuild) {
                    var typeDefs = typeDefinitions[typeKeyToBuild] || [],
                        inherits = typeDefs.map(function (typeDef) {
                            return asArray(typeDef.inherits || []);
                        }).reduce(function (a, b) {
                            return a.concat(b);
                        }, []),
                        def = collapse(
                            [getUndefinedType()].concat(
                                inherits.map(lookupTypeDef)
                            ).concat(typeDefs)
                        );

                    // Always provide a default name
                    def.model = def.model || {};
                    def.model.name = def.model.name
                        || ("Unnamed " + (def.name || "Object"));

                    return def;
                }

                return (self.typeMap[typeKey] =
                    self.typeMap[typeKey] || buildTypeDef(typeKey));
            }

            return new TypeImpl(lookupTypeDef(key));
        };

        return TypeProvider;
    }

);
