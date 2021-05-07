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
 * Module defining ImplementationLoader. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {

        /**
         * Responsible for loading extension implementations
         * (AMD modules.) Acts as a wrapper around RequireJS to
         * provide a promise-like API.
         * @memberof platform/framework
         * @constructor
         * @param {*} require RequireJS, or an object with similar API
         * @param {*} $log Angular's logging service
         */
        function ImplementationLoader(require) {
            this.require = require;
        }

        /**
         * Load an extension's implementation; or, equivalently,
         * load an AMD module. This is fundamentally similar
         * to a call to RequireJS, except that the result is
         * wrapped in a promise. The promise will be fulfilled
         * with the loaded module, or rejected with the error
         * reported by Require.
         *
         * @param {string} path the path to the module to load
         * @returns {Promise} a promise for the specified module.
         */
        ImplementationLoader.prototype.load = function loadModule(path) {
            var require = this.require;

            return new Promise(function (fulfill, reject) {
                require([path], fulfill, reject);
            });
        };

        return ImplementationLoader;
    }
);
