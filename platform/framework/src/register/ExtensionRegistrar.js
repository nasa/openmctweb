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
 * Module defining ExtensionRegistrar. Created by vwoeltje on 11/3/14.
 */
define(
    ['../Constants', './PartialConstructor'],
    function (Constants, PartialConstructor) {

        /**
         * Responsible for registering extensions with Angular.
         *
         * @memberof platform/framework
         * @constructor
         * @param {angular.Module} the Angular application with which
         *        extensions should be registered
         * @param {Object.<string,function>} customRegistrars an object
         *        containing custom registration functions, primarily for
         *        Angular built-ins.
         * @param {ExtensionSorter} sorter the sorter which will impose
         *        priority ordering upon extensions
         * @param {*} $log Angular's logging service
         */
        function ExtensionRegistrar(app, customRegistrars, sorter, $log) {
            // Track which extension categories have already been registered.
            // Exceptions will be thrown if the same extension category is
            // registered twice.
            this.registeredCategories = {};
            this.customRegistrars = customRegistrars || {};
            this.app = app;
            this.sorter = sorter;
            this.$log = $log;
        }

        /**
         * Register a group of resolved extensions with the Angular
         * module managed by this registrar.
         *
         * For convenient chaining (particularly from the framework
         * initializer's perspective), this returns the Angular
         * module with which extensions were registered.
         *
         * @param {Object.<string, object[]>} extensionGroup an object
         *        containing key-value pairs, where keys are extension
         *        categories and values are arrays of resolved
         *        extensions
         * @returns {angular.Module} the application module with
         *        which extensions were registered
         */
        ExtensionRegistrar.prototype.registerExtensions = function (extensionGroup) {
            var registeredCategories = this.registeredCategories,
                customRegistrars = this.customRegistrars,
                app = this.app,
                sorter = this.sorter,
                $log = this.$log;

            // Used to build unique identifiers for individual extensions,
            // so that these can be registered separately with Angular
            function identify(category, extension, index) {
                var name = extension.key
                    ? ("extension-" + extension.key + "#" + index)
                    : ("extension#" + index);

                return category + "[" + name + "]";
            }

            // Echo arguments; used to represent groups of non-built-in
            // extensions as a single dependency.
            function echo() {
                return Array.prototype.slice.call(arguments);
            }

            // Always return a static value; used to represent plain
            // metadata as a single dependency in Angular.
            function staticFunction(value) {
                return function () {
                    return value;
                };
            }

            // Utility function; create the second argument for Angular's
            // .service service registration method (an array containing
            // both dependencies and a factory method for the service.)
            function makeServiceArgument(category, extension) {
                var dependencies = extension.depends || [],
                    factory = (typeof extension === 'function')
                        ? new PartialConstructor(extension)
                        : staticFunction(extension);

                return dependencies.concat([factory]);
            }

            // Register extension arrays with Angular under an appropriately
            // suffixed name, e.g. "types[]"
            function registerExtensionArraysForCategory(category, names) {
                var name = category + Constants.EXTENSION_SUFFIX;
                app.factory(name, names.concat([echo]));
            }

            function registerExtensionsForCategory(category, extensions) {
                var names = [];

                function registerExtension(extension, index) {
                    var name = identify(category, extension, index);

                    // Track individual extension names as-registered
                    names.push(name);

                    app.factory(
                        name,
                        makeServiceArgument(category, extension)
                    );
                }

                if (registeredCategories[category]) {
                    $log.warn([
                        "Tried to register extensions for category ",
                        category,
                        " more than once. Ignoring all but first set."
                    ].join(""));
                } else {
                    // Register all extensions. Use custom registration
                    // code for services, directives, etc; otherwise,
                    // just register them under generic names.
                    if (customRegistrars[category]) {
                        customRegistrars[category](extensions);
                    } else {
                        extensions.forEach(registerExtension);
                        registerExtensionArraysForCategory(category, names);
                    }

                    registeredCategories[category] = true;

                    return true;
                }
            }

            // Check if a declared dependency looks like a dependency on
            // an extension category (e.g. is suffixed by [])
            function isExtensionDependency(dependency) {
                var index = dependency.indexOf(
                    Constants.EXTENSION_SUFFIX,
                    dependency.length - Constants.EXTENSION_SUFFIX.length
                );

                return index !== -1;
            }

            // Examine a group of resolved dependencies to determine
            // which extension categories still need to be satisfied.
            function findEmptyExtensionDependencies(extGroup) {
                var needed = {},
                    categories = Object.keys(extGroup),
                    allExtensions = [];

                // Build up an array of all extensions
                categories.forEach(function (category) {
                    allExtensions =
                        allExtensions.concat(extGroup[category]);
                });

                // Track all extension dependencies exposed therefrom
                allExtensions.forEach(function (extension) {
                    (extension.depends || []).filter(
                        isExtensionDependency
                    ).forEach(function (dependency) {
                        needed[dependency] = true;
                    });
                });

                // Remove categories which have been provided
                categories.forEach(function (category) {
                    var dependency = category + Constants.EXTENSION_SUFFIX;
                    delete needed[dependency];
                });

                return Object.keys(needed);
            }

            // Register any extension categories that are depended-upon but
            // have not been declared anywhere; such dependencies are then
            // satisfied by an empty array, instead of not at all.
            function registerEmptyDependencies(extGroup) {
                findEmptyExtensionDependencies(extGroup)
                    .forEach(function (name) {
                        $log.info("Registering empty extension category " + name);
                        app.factory(name, [staticFunction([])]);
                    });
            }

            // Announce we're entering a new phase
            $log.info("Registering extensions...");

            // Register all declared extensions by category
            Object.keys(extensionGroup).forEach(function (category) {
                registerExtensionsForCategory(
                    category,
                    sorter.sort(extensionGroup[category])
                );
            });

            // Also handle categories which are needed but not declared
            registerEmptyDependencies(extensionGroup);

            // Return the application to which these extensions
            // have been registered
            return app;
        };

        return ExtensionRegistrar;
    }
);
