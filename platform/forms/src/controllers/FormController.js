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
    [],
    function () {

        // Default ng-pattern; any non whitespace
        var NON_WHITESPACE = /\S/;

        /**
         * Controller for mct-form and mct-toolbar directives.
         * @memberof platform/forms
         * @constructor
         */
        function FormController($scope) {
            var regexps = [];

            // ng-pattern seems to want a RegExp, and not a
            // string (despite what documentation says) but
            // we want form structure to be JSON-expressible,
            // so we make RegExp's from strings as-needed
            function getRegExp(pattern) {
                // If undefined, don't apply a pattern
                if (!pattern) {
                    return NON_WHITESPACE;
                }

                // Just echo if it's already a regexp
                if (pattern instanceof RegExp) {
                    return pattern;
                }

                // Otherwise, assume a string
                // Cache for easy lookup later (so we don't
                // creat a new RegExp every digest cycle)
                if (!regexps[pattern]) {
                    regexps[pattern] = new RegExp(pattern);
                }

                return regexps[pattern];
            }

            // Publish the form state under the requested
            // name in the parent scope
            $scope.$watch("mctForm", function (mctForm) {
                if ($scope.name) {
                    $scope.$parent[$scope.name] = mctForm;
                }
            });

            // Expose the regexp lookup
            $scope.getRegExp = getRegExp;
        }

        return FormController;
    }
);
