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

define([
    './Constants',
    './FrameworkInitializer',
    './LogLevel',
    './load/BundleLoader',
    './resolve/ImplementationLoader',
    './resolve/ExtensionResolver',
    './resolve/BundleResolver',
    './register/CustomRegistrars',
    './register/ExtensionRegistrar',
    './register/ExtensionSorter',
    './bootstrap/ApplicationBootstrapper'
], function (
    Constants,
    FrameworkInitializer,
    LogLevel,
    BundleLoader,
    ImplementationLoader,
    ExtensionResolver,
    BundleResolver,
    CustomRegistrars,
    ExtensionRegistrar,
    ExtensionSorter,
    ApplicationBootstrapper
) {

    function FrameworkLayer($http, $log) {
        this.$http = $http;
        this.$log = $log;
    }

    FrameworkLayer.prototype.initializeApplication = function (
        angular,
        openmct,
        logLevel
    ) {
        var $http = this.$http,
            $log = this.$log,
            app = angular.module(Constants.MODULE_NAME, ["ngRoute"]),
            loader = new BundleLoader($http, $log, openmct.legacyRegistry),
            resolver = new BundleResolver(
                new ExtensionResolver(
                    new ImplementationLoader({}),
                    $log
                ),
                $log
            ),
            registrar = new ExtensionRegistrar(
                app,
                new CustomRegistrars(app, $log),
                new ExtensionSorter($log),
                $log
            ),
            bootstrapper = new ApplicationBootstrapper(
                angular,
                openmct.element,
                $log
            ),
            initializer = new FrameworkInitializer(
                loader,
                resolver,
                registrar,
                bootstrapper
            );

        // Override of angular1.6 ! hashPrefix
        app.config(['$locationProvider', function ($locationProvider) {
            $locationProvider.hashPrefix('');
        }]);

        // Apply logging levels; this must be done now, before the
        // first log statement.
        new LogLevel(logLevel).configure(app, $log);

        // Initialize the application
        $log.info("Initializing application.");

        return initializer.runApplication();
    };

    return FrameworkLayer;
});
