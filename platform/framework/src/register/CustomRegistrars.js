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
/* eslint-disable no-invalid-this */

/**
 * Module defining CustomRegistrars. Created by vwoeltje on 11/3/14.
 */
define(
    ['../Constants', './ServiceCompositor'],
    function (Constants, ServiceCompositor) {
        /*jshint validthis:true */

        /**
         * Handles registration of a few specific extension types that are
         * understood natively by Angular. This includes services and
         * directives.
         * @memberof platform/framework
         * @constructor
         */
        function CustomRegistrars(app, $log) {
            this.app = app;
            this.$log = $log;
            this.registered = {}; // Track registered keys by extension
        }

        // Utility; bind a function to a "this" pointer
        function bind(fn, thisArg) {
            return function () {
                return fn.apply(thisArg, arguments);
            };
        }

        // Used to create custom registration functions which map to
        // named methods on Angular modules, which follow the normal
        // app.method(key, [ deps..., function ]) pattern.
        function customRegistrar(angularFunction) {
            return function (extension, index) {
                var app = this.app,
                    $log = this.$log,
                    key = extension.key,
                    dependencies = extension.depends || [],
                    registered = this.registered[angularFunction] || {};

                this.registered[angularFunction] = registered;

                if (!key) {
                    $log.warn([
                        "Cannot register ",
                        angularFunction,
                        " ",
                        index,
                        ", no key specified. ",
                        JSON.stringify(extension)
                    ].join(""));
                } else if (registered[key]) {
                    $log.debug([
                        "Already registered ",
                        angularFunction,
                        " with key ",
                        key,
                        "; skipping."
                    ].join(""));
                } else {
                    $log.info([
                        "Registering ",
                        angularFunction,
                        ": ",
                        key
                    ].join(""));
                    registered[key] = true;
                    app[angularFunction](
                        key,
                        dependencies.concat([extension])
                    );
                }
            };
        }

        function registerConstant(extension) {
            var app = this.app,
                $log = this.$log,
                key = extension.key,
                value = extension.value;

            if (typeof key === "string" && value !== undefined) {
                $log.info([
                    "Registering constant: ",
                    key,
                    " with value ",
                    value
                ].join(""));
                app.constant(key, value);
            } else {
                $log.warn([
                    "Cannot register constant ",
                    key,
                    " with value ",
                    value
                ].join(""));
            }

        }

        // Custom registration function for extensions of category "runs"
        function registerRun(extension) {
            var app = this.app,
                $log = this.$log;

            if (typeof extension === 'function') {
                // Prepend dependencies, and schedule to run
                app.run((extension.depends || []).concat([extension]));
            } else {
                // If it's not a function, no implementation was given
                $log.warn([
                    "Cannot register run extension from ",
                    (extension.bundle || {}).path,
                    "; no implementation."
                ].join(""));
            }
        }

        // Custom registration function for extensions of category "route"
        function registerRoute(extension) {
            var app = this.app,
                $log = this.$log,
                route = Object.create(extension);

            // Adjust path for bundle
            if (route.templateUrl) {
                route.templateUrl = [
                    route.bundle.path,
                    route.bundle.resources,
                    route.templateUrl
                ].join(Constants.SEPARATOR);
            }

            // Log the registration
            $log.info("Registering route: " + (route.key || route.when));

            // Register the route with Angular
            app.config(['$routeProvider', function ($routeProvider) {
                if (route.when) {
                    $routeProvider.when(route.when, route);
                } else {
                    $routeProvider.otherwise(route);
                }
            }]);
        }

        // Handle service compositing
        function registerComponents(components) {
            var app = this.app,
                $log = this.$log;

            return new ServiceCompositor(app, $log)
                .registerCompositeServices(components);
        }

        // Utility; create a function which converts another function
        // (which acts on single objects) to one which acts upon arrays.
        function mapUpon(func) {
            return function (array) {
                return array.map(bind(func, this));
            };
        }

        // More like key-value pairs than methods; key is the
        // name of the extension category to be handled, and the value
        // is the function which handles it.

        /**
         * Register constant values.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.constants =
            mapUpon(registerConstant);

        /**
         * Register Angular routes.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.routes =
            mapUpon(registerRoute);

        /**
         * Register Angular directives.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.directives =
            mapUpon(customRegistrar("directive"));

        /**
         * Register Angular controllers.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.controllers =
            mapUpon(customRegistrar("controller"));

        /**
         * Register Angular services.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.services =
            mapUpon(customRegistrar("service"));

        /**
         * Register Angular filters.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.filters =
            mapUpon(customRegistrar("filter"));

        /**
         * Register functions which will run after bootstrapping.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.runs =
            mapUpon(registerRun);

        /**
         * Register components of composite services.
         * @param {Array} extensions the resolved extensions
         */
        CustomRegistrars.prototype.components =
            registerComponents;

        return CustomRegistrars;
    }
);
