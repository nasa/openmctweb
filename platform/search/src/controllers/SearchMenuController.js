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
 * Module defining SearchMenuController. Created by shale on 08/17/2015.
 */
define(function () {

    function SearchMenuController($scope, types) {

        // Model variables are:
        //   ngModel.filter, the function filter defined in SearchController
        //   ngModel.types, an array of type objects
        //   ngModel.checked, a dictionary of which type filter options are checked
        //   ngModel.checkAll, a boolean of whether all of the types in ngModel.checked are checked
        //   ngModel.filtersString, a string list of what filters on the results are active
        $scope.ngModel.types = [];
        $scope.ngModel.checked = {};
        $scope.ngModel.checkAll = true;
        $scope.ngModel.filtersString = '';

        // On initialization, fill the model's types with type keys
        types.forEach(function (type) {
            // We only want some types, the ones that are probably human readable
            // Manually remove 'root', but not 'unknown'
            if (type.key && type.name && type.key !== 'root') {
                $scope.ngModel.types.push(type);
                $scope.ngModel.checked[type.key] = false;
            }
        });

        // For documentation, see updateOptions below
        function updateOptions() {
            var type,
                i;

            // Update all-checked status
            if ($scope.ngModel.checkAll) {
                for (type in $scope.ngModel.checked) {
                    if ($scope.ngModel.checked[type]) {
                        $scope.ngModel.checkAll = false;
                    }
                }
            }

            // Update the current filters string
            $scope.ngModel.filtersString = '';
            if (!$scope.ngModel.checkAll) {
                for (i = 0; i < $scope.ngModel.types.length; i += 1) {
                    // If the type key corresponds to a checked option...
                    if ($scope.ngModel.checked[$scope.ngModel.types[i].key]) {
                        // ... add it to the string list of current filter options
                        if ($scope.ngModel.filtersString === '') {
                            $scope.ngModel.filtersString += $scope.ngModel.types[i].name;
                        } else {
                            $scope.ngModel.filtersString += ', ' + $scope.ngModel.types[i].name;
                        }
                    }
                }

                // If there's still nothing in the filters string, there are no
                //   filters selected
                if ($scope.ngModel.filtersString === '') {
                    $scope.ngModel.checkAll = true;
                }
            }

            // Re-filter results
            $scope.ngModel.filter();
        }

        // For documentation, see checkAll below
        function checkAll() {
            // Reset all the other options to original/default position
            Object.keys($scope.ngModel.checked).forEach(function (type) {
                $scope.ngModel.checked[type] = false;
            });

            // This setting will make the filters display hidden
            $scope.ngModel.filtersString = '';
            // Do not let checkAll become unchecked when it is the only checked filter
            if (!$scope.ngModel.checkAll) {
                $scope.ngModel.checkAll = true;
            }

            // Re-filter results
            $scope.ngModel.filter();
        }

        return {
            /**
             * Updates the status of the checked options. Updates the filtersString
             *   with which options are checked. Re-filters the search results after.
             *   Not intended to be called by checkAll when it is toggled.
             */
            updateOptions: updateOptions,

            /**
             * Handles the search and filter options for when checkAll has been
             *   toggled. This is a special case, compared to the other search
             *   menu options, so is intended to be called instead of updateOptions.
             */
            checkAll: checkAll
        };
    }

    return SearchMenuController;
});
