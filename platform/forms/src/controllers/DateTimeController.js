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
    ["moment"],
    function (moment) {

        var DATE_FORMAT = "YYYY-MM-DD";

        /**
         * Controller for the `datetime` form control.
         * This is a composite control; it includes multiple
         * input fields but outputs a single timestamp (in
         * milliseconds since start of 1970) to the ngModel.
         *
         * @memberof platform/forms
         * @constructor
         */
        function DateTimeController($scope) {

            // Update the
            function update() {
                var date = $scope.datetime.date,
                    hour = $scope.datetime.hour,
                    min = $scope.datetime.min,
                    sec = $scope.datetime.sec,
                    fullDateTime = moment.utc(date, DATE_FORMAT)
                        .hour(hour || 0)
                        .minute(min || 0)
                        .second(sec || 0);

                if (fullDateTime.isValid()) {
                    $scope.ngModel[$scope.field] = fullDateTime.valueOf();
                }

                // If anything is complete, say so in scope; there are
                // ng-required usages that will update off of this (to
                // allow datetime to be optional while still permitting
                // incomplete input)
                $scope.partiallyComplete =
                    Object.keys($scope.datetime).some(function (key) {
                        return $scope.datetime[key];
                    });

                // Treat empty input as an undefined value
                if (!$scope.partiallyComplete) {
                    $scope.ngModel[$scope.field] = undefined;
                }
            }

            function updateDateTime(value) {
                var m;
                if (value !== undefined) {
                    m = moment.utc(value);
                    $scope.datetime = {
                        date: m.format(DATE_FORMAT),
                        hour: m.format("H"),
                        min: m.format("m"),
                        sec: m.format("s")
                    };
                } else {
                    $scope.datetime = {};
                }
            }

            // ...and update form values when actual field in model changes
            $scope.$watch("ngModel[field]", updateDateTime);

            // Update value whenever any field changes.
            $scope.$watch("datetime.date", update);
            $scope.$watch("datetime.hour", update);
            $scope.$watch("datetime.min", update);
            $scope.$watch("datetime.sec", update);

            // Expose format string for placeholder
            $scope.format = DATE_FORMAT;

            // Initialize forms values
            updateDateTime(
                ($scope.ngModel && $scope.field)
                    ? $scope.ngModel[$scope.field] : undefined
            );
        }

        return DateTimeController;

    }
);

