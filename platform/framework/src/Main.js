/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define, window, requirejs*/

/**
 * Implements the framework layer, which handles the loading of bundles
 * and the wiring-together of the extensions they expose.
 * @namespace platform/framework
 */
define(
    [
        'require',
        'es6-promise',
        './FrameworkLayer',
        'angular',
        'angular-route'
    ],
    function (
        require,
        es6promise,
        FrameworkLayer,
        angular
    ) {
        "use strict";

        function Main() {
        }

        Main.prototype.run = function (legacyRegistry) {
            // Get a reference to Angular's injector, so we can get $http and $log
            // services, which are useful to the framework layer.
            var injector = angular.injector(['ng']);

            // Look up log level from query string
            function logLevel() {
                var match = /[?&]log=([a-z]+)/.exec(window.location.search);
                return match ? match[1] : "";
            }

            // Polyfill Promise, in case browser does not natively provide Promise
            window.Promise = window.Promise || es6promise.Promise;

            // Reconfigure base url, since bundle paths will all be relative
            // to the root now.
            requirejs.config({"baseUrl": ""});
            injector.instantiate(['$http', '$log', FrameworkLayer])
                .initializeApplication(angular, legacyRegistry, logLevel());
        };

        return Main;
    }
);
