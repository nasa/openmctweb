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

define(
    ['../Constants', './Extension'],
    function (Constants, Extension) {

        /**
         * A bundle's plain JSON definition.
         *
         * @name BundleDefinition
         * @property {string} name the human-readable name of this bundle
         * @property {string} sources the name of the directory which
         *           contains source code used by this bundle
         * @property {string} resources the name of the directory which
         *           contains resource files used by this bundle
         * @property {Object.<string,ExtensionDefinition[]>} [extensions={}]
         *           all extensions exposed by this bundle
         * @constructor
         * @memberof platform/framework
         */

        /**
         * Instantiate a new reference to a bundle, based on its human-readable
         * definition.
         *
         * @param {string} path the path to the directory containing
         *        this bundle
         * @param {BundleDefinition} bundleDefinition
         * @returns {{getDefinition: Function}}
         * @constructor
         */
        function Bundle(path, bundleDefinition) {
            // Start with defaults
            var definition = Object.create(Constants.DEFAULT_BUNDLE),
                logName = path;

            // Override defaults with specifics from bundle definition
            Object.keys(bundleDefinition).forEach(function (k) {
                definition[k] = bundleDefinition[k];
            });

            // Record path to bundle in definition
            definition.path = path;

            // Build up the log-friendly name for this bundle
            if (definition.key || definition.name) {
                logName += "(";
                logName += definition.key || "";
                logName += (definition.key && definition.name) ? " " : "";
                logName += definition.name || "";
                logName += ")";
            }

            this.path = path;
            this.definition = definition;
            this.logName = logName;
        }

        // Utility function for resolving paths in this bundle
        Bundle.prototype.resolvePath = function (elements) {
            var path = this.path;

            return [path].concat(elements || []).join(Constants.SEPARATOR);
        };

        /**
         * Get the path to this bundle.
         * @returns {string} path to this bundle;
         */
        Bundle.prototype.getPath = function () {
            return this.path;
        };

        /**
         * Get the path to this bundle's source folder. If an
         * argument is provided, the path will be to the source
         * file within the bundle's source file.
         *
         * @param {string} [sourceFile] optionally, give a path to
         *        a specific source file in the bundle.
         * @returns {string} path to the source folder (or to the
         *          source file within it)
         */
        Bundle.prototype.getSourcePath = function (sourceFile) {
            var subpath = sourceFile
                ? [this.definition.sources, sourceFile]
                : [this.definition.sources];

            return this.resolvePath(subpath);
        };

        /**
         * Get the path to this bundle's resource folder. If an
         * argument is provided, the path will be to the resource
         * file within the bundle's resource file.
         *
         * @param {string} [resourceFile] optionally, give a path to
         *        a specific resource file in the bundle.
         * @returns {string} path to the resource folder (or to the
         *          resource file within it)
         */
        Bundle.prototype.getResourcePath = function (resourceFile) {
            var subpath = resourceFile
                ? [this.definition.resources, resourceFile]
                : [this.definition.resources];

            return this.resolvePath(subpath);
        };

        /**
         * Get the path to this bundle's library folder. If an
         * argument is provided, the path will be to the library
         * file within the bundle's resource file.
         *
         * @param {string} [libraryFile] optionally, give a path to
         *        a specific library file in the bundle.
         * @returns {string} path to the resource folder (or to the
         *          resource file within it)
         */
        Bundle.prototype.getLibraryPath = function (libraryFile) {
            var subpath = libraryFile
                ? [this.definition.libraries, libraryFile]
                : [this.definition.libraries];

            return this.resolvePath(subpath);
        };

        /**
         * Get library configuration for this bundle. This is read
         * from the bundle's definition; if the bundle is well-formed,
         * it will resemble a require.config object.
         * @returns {object} library configuration
         */
        Bundle.prototype.getConfiguration = function () {
            return this.definition.configuration || {};
        };

        /**
         * Get a log-friendly name for this bundle; this will
         * include both the key (machine-readable name for this
         * bundle) and the name (human-readable name for this
         * bundle.)
         * @returns {string} log-friendly name for this bundle
         */
        Bundle.prototype.getLogName = function () {
            return this.logName;
        };

        /**
         * Get all extensions exposed by this bundle of a given
         * category.
         *
         * @param {string} category name of the extension category
         * @returns {Array} extension definitions of that category
         */
        Bundle.prototype.getExtensions = function (category) {
            var extensions = this.definition.extensions[category] || [],
                self = this;

            return extensions.map(function objectify(extDefinition) {
                return new Extension(self, category, extDefinition);
            });
        };

        /**
         * Get a list of all extension categories exposed by this bundle.
         *
         * @returns {string[]} the extension categories
         */
        Bundle.prototype.getExtensionCategories = function () {
            return Object.keys(this.definition.extensions);
        };

        /**
         * Get the plain definition of this bundle, as read from
         * its JSON declaration.
         *
         * @returns {platform/framework.BundleDefinition} the raw
         *          definition of this bundle
         */
        Bundle.prototype.getDefinition = function () {
            return this.definition;
        };

        return Bundle;
    }
);
