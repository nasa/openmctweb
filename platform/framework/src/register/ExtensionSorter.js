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
    ["../Constants"],
    function (Constants) {

        /**
         * Responsible for applying priority order to extensions in a
         * given category. This will sort in reverse order of the numeric
         * priority given for extensions in the `priority` priority (such
         * that large values are registered first.) Extensions may also
         * specify symbolic properties as strings (instead of numbers),
         * which will be looked up from the table `Constants.PRIORITY_LEVELS`.
         * @param $log Angular's logging service
         * @memberof platform/framework
         * @constructor
         */
        function ExtensionSorter($log) {
            this.$log = $log;
        }

        /**
         * Sort extensions according to priority.
         *
         * @param {object[]} extensions array of resolved extensions
         * @returns {object[]} the same extensions, in priority order
         */
        ExtensionSorter.prototype.sort = function (extensions) {
            var $log = this.$log;

            // Handle unknown or malformed priorities specified by extensions
            function unrecognizedPriority(extension) {
                // Issue a warning
                $log.warn([
                    "Unrecognized priority '",
                    (extension || {}).priority,
                    "' specified for extension from ",
                    ((extension || {}).bundle || {}).path,
                    "; defaulting to ",
                    Constants.DEFAULT_PRIORITY
                ].join(''));

                // Provide a return value (default priority) to make this
                // useful in an expression.
                return Constants.DEFAULT_PRIORITY;
            }

            function getPriority(extension) {
                var priority =
                    (extension || {}).priority || Constants.DEFAULT_PRIORITY;

                // If it's a symbolic priority, look it up
                if (typeof priority === 'string') {
                    priority = Constants.PRIORITY_LEVELS[priority];
                }

                // Should be a number; otherwise, issue a warning and
                // fall back to default priority level.
                return (typeof priority === 'number')
                    ? priority : unrecognizedPriority(extension);
            }

            // Attach a numeric priority to an extension; this is done in
            // one pass outside of the comparator, mainly because getPriority
            // may log warnings, and we only want this to happen once
            // (instead of the many times that might occur during a sort.)
            function prioritize(extension, index) {
                return {
                    // The extension itself, for later unwrapping
                    extension: extension,
                    // The index, to provide a stable sort (see compare)
                    index: index,
                    // The numeric priority of the extension
                    priority: getPriority(extension)
                };
            }

            // Unwrap the original extension
            // (for use after ordering has been applied)
            function deprioritize(prioritized) {
                return prioritized.extension;
            }

            // Compare two prioritized extensions
            function compare(a, b) {
                // Reverse order by numeric priority; or, original order.
                return (b.priority - a.priority) || (a.index - b.index);
            }

            return (extensions || [])
                .map(prioritize)
                .sort(compare)
                .map(deprioritize);
        };

        return ExtensionSorter;
    }
);
