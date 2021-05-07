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
 * Module defining FrameworkInitializer. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {

        /**
         * Responsible for managing the four stages of framework
         * initialization:
         *
         * * Loading bundle metadata (JSON files)
         * * Resolving extension implementations with Require
         * * Registering extensions with Angular
         * * Bootstrapping the Angular application.
         *
         * @memberof platform/framework
         * @constructor
         * @param {platform/framework.BundleLoader} loader
         * @param {platform/framework.BundleResolver} resolver
         * @param {platform/framework.ExtensionRegistrar} registrar
         * @param {platform/framework.ApplicationBootstrapper} bootstrapper
         */
        function FrameworkInitializer(loader, resolver, registrar, bootstrapper) {
            this.loader = loader;
            this.resolver = resolver;
            this.registrar = registrar;
            this.bootstrapper = bootstrapper;
        }

        function bind(method, thisArg) {
            return function () {
                return method.apply(thisArg, arguments);
            };
        }

        /**
         * Run the application defined by this set of bundles.
         * @param bundleList
         * @returns {*}
         */
        FrameworkInitializer.prototype.runApplication = function () {
            return this.loader.loadBundles([])
                .then(bind(this.resolver.resolveBundles, this.resolver))
                .then(bind(this.registrar.registerExtensions, this.registrar))
                .then(bind(this.bootstrapper.bootstrap, this.bootstrapper));
        };

        return FrameworkInitializer;
    }
);
