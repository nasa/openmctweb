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
 * Module defining ViewSwitcherController. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {

        /**
         * Controller for the view switcher; populates and maintains a list
         * of applicable views for a represented domain object.
         * @memberof platform/commonUI/general
         * @constructor
         */
        function ViewSwitcherController($scope, $timeout) {
            // If the view capability gets refreshed, try to
            // keep the same option chosen.
            function findMatchingOption(options, selected) {
                var i;

                if (selected) {
                    for (i = 0; i < options.length; i += 1) {
                        if (options[i].key === selected.key) {
                            return options[i];
                        }
                    }
                }

                return options[0];
            }

            // Get list of views, read from capability
            function updateOptions(views) {
                if (Array.isArray(views)) {
                    $timeout(function () {
                        $scope.ngModel.selected = findMatchingOption(
                            views,
                            ($scope.ngModel || {}).selected
                        );
                    }, 0);
                }
            }

            // Update view options when the in-scope results of using the
            // view capability change.
            $scope.$watch("view", updateOptions);
        }

        return ViewSwitcherController;
    }
);

