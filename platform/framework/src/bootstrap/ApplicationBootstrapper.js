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
 * Module defining Bootstrapper. Created by vwoeltje on 11/4/14.
 *
 * The bootstrapper is responsible
 */
define(
    [],
    function () {

        /**
         * The application bootstrapper is responsible for issuing the
         * bootstrap call to Angular. This would normally not be needed
         * with an appropriately-placed ng-app directive, but the
         * framework needs to wait until all extensions have been loaded
         * and registered.
         *
         * @memberof platform/framework
         * @constructor
         */
        function ApplicationBootstrapper(angular, document, $log) {
            this.angular = angular;
            this.document = document;
            this.$log = $log;
        }

        /**
         * Bootstrap the application.
         *
         * @param {angular.Module} app the Angular application to
         *        bootstrap
         */
        ApplicationBootstrapper.prototype.bootstrap = function (app) {
            var angular = this.angular,
                document = this.document,
                $log = this.$log;

            return new Promise(function (resolve, reject) {
                $log.info("Bootstrapping application " + (app || {}).name);
                angular.element(document).ready(function () {
                    angular.bootstrap(document, [app.name], { strictDi: true });
                    resolve(angular);
                });
            });
        };

        return ApplicationBootstrapper;
    }
);
