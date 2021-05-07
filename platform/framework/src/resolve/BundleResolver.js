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
 * Module defining BundleResolver. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {

        /**
         * Responsible for the extension resolution phase of framework
         * initialization. During this phase, any scripts implementing
         * extensions provided by bundles are loaded.
         *
         * @memberof platform/framework
         * @constructor
         */
        function BundleResolver(extensionResolver, $log) {
            this.extensionResolver = extensionResolver;
            this.$log = $log;
        }

        /**
         * Resolve all extensions exposed by these bundles.
         *
         * @param {Bundle[]} bundles the bundles to resolve
         * @returns {Promise.<Object.<string, object[]>>} an promise
         *          for an object containing
         *          key-value pairs, where keys are extension
         *          categories and values are arrays of resolved
         *          extensions belonging to those categories
         */
        BundleResolver.prototype.resolveBundles = function (bundles) {
            var extensionResolver = this.extensionResolver,
                $log = this.$log;

            /*
             * Merge resolved bundles (where each is expressed as an
             * object containing key-value pairs, where keys are extension
             * categories and values are arrays of resolved extensions)
             * into one large object containing resolved extensions from
             * all bundles (in the same form.)
             *
             * @param {Object.<string, object[]>|Array} resolvedBundles
             * @returns {Object.<string, object[]>}
             * @memberof platform/framework.BundleResolver#
             */
            function mergeResolvedBundles(resolvedBundles) {
                var result = {};

                resolvedBundles.forEach(function (resolved) {
                    Object.keys(resolved).forEach(function (k) {
                        result[k] = (result[k] || []).concat(resolved[k]);
                    });
                });

                return result;
            }

            // Resolve a bundle; resolve all extensions, and return
            // the resolved extensions in an object in the format described
            // for mergeResolvedBundles above
            function resolveBundle(bundle) {
                var categories = bundle.getExtensionCategories(),
                    result = {};

                function resolveExtension(extension) {
                    var category = extension.getCategory();

                    function push(resolved) {
                        result[category].push(resolved);
                    }

                    return extensionResolver.resolve(extension).then(push);
                }

                function resolveCategory(category) {
                    result[category] = [];

                    return Promise.all(
                        bundle.getExtensions(category).map(resolveExtension)
                    );
                }

                function giveResult() {
                    return result;
                }

                // Log the large-scale task
                $log.info(
                    "Resolving extensions for bundle " + bundle.getLogName()
                );

                return Promise.all(categories.map(resolveCategory))
                    .then(giveResult);
            }

            // Then, resolve all extension implementations.
            return Promise.all(bundles.map(resolveBundle))
                .then(mergeResolvedBundles);
        };

        return BundleResolver;
    }
);
