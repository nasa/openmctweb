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
 * Module defining ExtensionResolver. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {

        /**
         * An ExtensionResolver is responsible for loading any implementation
         * modules associated with specific extensions.
         *
         * @param {ImplementationLoader} loader used to load implementations
         * @param {*} $log Angular's logging service
         * @memberof platform/framework
         * @constructor
         */
        function ExtensionResolver(loader, $log) {
            this.loader = loader;
            this.$log = $log;
        }

        /**
         * Resolve the provided extension; this will give a promise
         * for the extension's implementation, if one has been
         * specified, or for the plain definition of the extension
         * otherwise. The plain definition will also be given
         * if the implementation fails to load for some reason.
         *
         * All key-value pairs from the extension definition
         * will additionally be attached to any loaded implementation.
         *
         * @param {Extension} extension the extension to resolve
         * @returns {Promise} a promise for the resolved extension
         */
        ExtensionResolver.prototype.resolve = function (extension) {
            var loader = this.loader,
                $log = this.$log;

            function loadImplementation(ext) {
                var implPromise = ext.hasImplementationValue()
                        ? Promise.resolve(ext.getImplementationValue())
                        : loader.load(ext.getImplementationPath()),
                    definition = ext.getDefinition();

                // Wrap a constructor function (to avoid modifying the original)
                function constructorFor(impl) {
                    function Constructor() {
                        return impl.apply(this, arguments);
                    }

                    Constructor.prototype = impl.prototype;

                    return Constructor;
                }

                // Attach values from the object definition to the
                // loaded implementation.
                function attachDefinition(impl) {
                    var result = (typeof impl === 'function')
                        ? constructorFor(impl)
                        : Object.create(impl);

                    // Copy over static properties
                    Object.keys(impl).forEach(function (k) {
                        result[k] = impl[k];
                    });

                    // Copy over definition
                    Object.keys(definition).forEach(function (k) {
                        if (result[k] === undefined) {
                            result[k] = definition[k];
                        }
                    });
                    result.definition = definition;

                    // Log that this load was successful
                    $log.info("Resolved " + ext.getLogName());

                    return result;
                }

                // Log any errors in loading the implementation, and
                // return the plain extension definition instead.
                function handleError(err) {
                    // Build up a log message from parts
                    var message = [
                        "Could not load implementation for extension ",
                        ext.getLogName(),
                        " due to ",
                        err.message
                    ].join("");

                    // Log that the extension was not loaded
                    $log.warn(message);

                    return ext.getDefinition();
                }

                if (!ext.hasImplementationValue()) {
                    // Log that loading has begun
                    $log.info([
                        "Loading implementation ",
                        ext.getImplementationPath(),
                        " for extension ",
                        ext.getLogName()
                    ].join(""));
                }

                return implPromise.then(attachDefinition, handleError);
            }

            // Log that loading has begun
            $log.info([
                "Resolving extension ",
                extension.getLogName()
            ].join(""));

            return extension.hasImplementation()
                ? loadImplementation(extension)
                : Promise.resolve(extension.getDefinition());
        };

        return ExtensionResolver;
    }
);
