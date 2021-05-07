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
 * Defines MergedModel, which allows a deep merge of domain object
 * models, or JSONifiable JavaScript objects generally.
 *
 */
define(
    function () {

        /**
         * Utility function for merging domain object models (or any
         * JavaScript object which follows the same conventions.)
         * Performs a "deep merge", resolving conflicts (occurrences
         * of the same property in both objects) such that:
         *
         * * Non-conflicting properties are both contained in the
         *   result object.
         * * Conflicting properties which are both arrays are
         *   concatenated.
         * * Conflicting properties which are both objects are
         *   merged recursively.
         * * Conflicting properties which do not fall into any of the
         *   preceding categories are taken from the second argument,
         *   shadowing any values from the first.
         *
         * An optional third argument, the "merger", may be provided.
         * This may be either a function, or an object containing
         * key-value pairs where keys are strings (corresponding to
         * the names of properties) and values are other mergers
         * (either functions or objects.)
         *
         * * If the merger is a function, it will be used upon the
         *   two input objects in lieu of the behavior described
         *   above.
         * * If the merger is an object, then its values will be
         *   used as mergers when resolving properties with
         *   corresponding keys in the recursive step.
         *
         *
         * @param modelA the first object to be merged
         * @param modelB the second object to be merged
         * @param merger the merger, as described above
         * @returns {*} the result of merging `modelA` and `modelB`
         * @constructor
         * @memberof platform/core
         */
        function mergeModels(modelA, modelB, merger) {
            var mergeFunction;

            function mergeArrays(a, b) {
                return a.concat(b);
            }

            function mergeObjects(a, b) {
                var result = {};
                Object.keys(a).forEach(function (k) {
                    result[k] = Object.prototype.hasOwnProperty.call(b, k)
                        ? mergeModels(a[k], b[k], (merger || {})[k])
                        : a[k];
                });
                Object.keys(b).forEach(function (k) {
                    // Copy any properties not already merged
                    if (!Object.prototype.hasOwnProperty.call(a, k)) {
                        result[k] = b[k];
                    }
                });

                return result;
            }

            function mergeOther(a, b) {
                return b;
            }

            mergeFunction = (merger && Function.isFunction(merger)) ? merger
                : (Array.isArray(modelA) && Array.isArray(modelB)) ? mergeArrays
                    : (modelA instanceof Object && modelB instanceof Object) ? mergeObjects
                        : mergeOther;

            return mergeFunction(modelA, modelB);
        }

        return mergeModels;
    }
);
