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
 * Implements the framework layer, which handles the loading of bundles
 * and the wiring-together of the extensions they expose.
 * @namespace platform/framework
 */
define(
    [
        './FrameworkLayer',
        'angular',
        'angular-route'
    ],
    function (
        FrameworkLayer,
        angular
    ) {

        function Main() {
        }

        Main.prototype.run = function (openmct) {
            // Get a reference to Angular's injector, so we can get $http and $log
            // services, which are useful to the framework layer.
            var injector = angular.injector(['ng']);

            // Look up log level from query string
            function logLevel() {
                var match = /[?&]log=([a-z]+)/.exec(window.location.search);

                return match ? match[1] : "";
            }

            return injector.instantiate(['$http', '$log', FrameworkLayer])
                .initializeApplication(angular, openmct, logLevel());
        };

        return Main;
    }
);
