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
 * Module defining ServiceCompositor. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {

        /**
         * Handles service compositing; that is, building up services
         * from provider, aggregator, and decorator components.
         *
         * @memberof platform/framework
         * @constructor
         */
        function ServiceCompositor(app, $log) {
            this.latest = {};
            this.providerLists = {}; // Track latest services registered
            this.app = app;
            this.$log = $log;
        }

        /**
         * Register composite services with Angular. This will build
         * up a dependency hierarchy between providers, aggregators,
         * and/or decorators, such that a dependency upon the service
         * type they expose shall be satisfied by their fully-wired
         * whole.
         *
         * Note that this method assumes that a complete set of
         * components shall be provided. Multiple calls to this
         * method may not behave as expected.
         *
         * @param {Array} components extensions of category component
         */
        ServiceCompositor.prototype.registerCompositeServices = function (components) {
            var latest = this.latest,
                providerLists = this.providerLists,
                app = this.app,
                $log = this.$log;

            // Log a warning; defaults to "no service provided by"
            function warn(extension, category, message) {
                var msg = message || "No service provided by";
                $log.warn([
                    msg,
                    " ",
                    category,
                    " ",
                    extension.key,
                    " from bundle ",
                    (extension.bundle || { path: "unknown bundle" }).path,
                    "; skipping."
                ].join(""));
            }

            //Log an info: defaults to "no service provide by"
            function info(extension, category, message) {
                var msg = message || "No service provided by";
                $log.info([
                    msg,
                    " ",
                    category,
                    " ",
                    extension.key,
                    " from bundle ",
                    (extension.bundle || { path: "unknown bundle" }).path,
                    "; skipping."
                ].join(""));
            }

            // Echo arguments; used to represent groups of non-built-in
            // extensions as a single dependency.
            function echoMany() {
                return Array.prototype.slice.call(arguments);
            }

            // Echo arguments; used to represent groups of non-built-in
            // extensions as a single dependency.
            function echoSingle(value) {
                return value;
            }

            // Generates utility functions to match types (one of
            // provider, aggregator, or decorator) of component. Used
            // to filter down to specific types, which are handled
            // in order.
            function hasType(type) {
                return function (extension) {
                    return extension.type === type;
                };
            }

            // Make a unique name for a service component.
            function makeName(category, service, index) {
                return [
                    service,
                    "[",
                    category,
                    "#",
                    index,
                    "]"
                ].join("");
            }

            // Register a specific provider instance with Angular, and
            // record its name for subsequent stages.
            function registerProvider(provider, index) {
                var service = provider.provides,
                    dependencies = provider.depends || [],
                    name = makeName("provider", service, index);

                if (!service) {
                    return warn(provider, "provider");
                }

                providerLists[service] = providerLists[service] || [];
                providerLists[service].push(name);

                // This provider is the latest candidate for resolving
                // the composite service.
                latest[service] = name;

                app.service(name, dependencies.concat([provider]));

                $log.info("Registering provider for " + service);
            }

            // Register an array of providers as a single dependency;
            // aggregators will then depend upon this to consume all
            // aggregated providers as a single dependency.
            function registerProviderSets() {
                Object.keys(providerLists).forEach(function (service) {
                    var name = makeName("provider", service, "*"),
                        list = providerLists[service];

                    $log.info([
                        "Compositing",
                        list.length,
                        "providers for",
                        service
                    ].join(" "));

                    app.service(name, list.concat([echoMany]));
                });
            }

            // Registers an aggregator via Angular, including both
            // its declared dependencies and the additional, implicit
            // dependency upon the array of all providers.
            function registerAggregator(aggregator, index) {
                var service = aggregator.provides,
                    dependencies = aggregator.depends || [],
                    providerSetName = makeName("provider", service, "*"),
                    name = makeName("aggregator", service, index);

                if (!service) {
                    return info(aggregator, "aggregator");
                }

                // Aggregators need other services to aggregate, otherwise they
                // do nothing.
                if (!latest[service]) {
                    return info(
                        aggregator,
                        "aggregator",
                        "No services to aggregate for"
                    );
                }

                dependencies = dependencies.concat([providerSetName]);
                latest[service] = name;

                app.service(name, dependencies.concat([aggregator]));
            }

            // Registers a decorator via Angular, including its implicit
            // dependency on the latest service component which has come
            // before it.
            function registerDecorator(decorator, index) {
                var service = decorator.provides,
                    dependencies = decorator.depends || [],
                    name = makeName("decorator", service, index);

                if (!service) {
                    return warn(decorator, "decorator");
                }

                // Decorators need other services to decorate, otherwise they
                // do nothing.
                if (!latest[service]) {
                    return warn(
                        decorator,
                        "decorator",
                        "No services to decorate for"
                    );
                }

                dependencies = dependencies.concat([latest[service]]);
                latest[service] = name;

                app.service(name, dependencies.concat([decorator]));
            }

            // Alias the latest services of various types back to the
            // more general service declaration.
            function registerLatest() {
                Object.keys(latest).forEach(function (service) {
                    app.service(service, [latest[service], echoSingle]);
                });
            }

            // Register composite services in phases:
            // * Register providers
            // * Register aggregators (which use providers)
            // * Register decorators (which use anything)
            // Then, register the latest candidate as a plain service.
            function registerComposites(providers, aggregators, decorators) {
                providers.forEach(registerProvider);
                registerProviderSets();
                aggregators.forEach(registerAggregator);
                decorators.forEach(registerDecorator);
                registerLatest();
            }

            // Initial point of entry; split into three component types.
            registerComposites(
                components.filter(hasType("provider")),
                components.filter(hasType("aggregator")),
                components.filter(hasType("decorator"))
            );
        };

        return ServiceCompositor;
    }
);
