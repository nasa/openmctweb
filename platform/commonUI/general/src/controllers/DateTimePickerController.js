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
    ['moment'],
    function (moment) {

        var TIME_NAMES = {
                'hours': "Hour",
                'minutes': "Minute",
                'seconds': "Second"
            },
            MONTHS = moment.months(),
            TIME_OPTIONS = (function makeRanges() {
                var arr = [];
                while (arr.length < 60) {
                    arr.push(arr.length);
                }

                return {
                    hours: arr.slice(0, 24),
                    minutes: arr,
                    seconds: arr
                };
            }());

        /**
         * Controller to support the date-time picker.
         *
         * Adds/uses the following properties in scope:
         * * `year`: Year being displayed in picker
         * * `month`: Month being displayed
         * * `table`: Table being displayed; array of arrays of
         *   * `day`: Day of month
         *   * `dayOfYear`: Day of year
         *   * `month`: Month associated with the day
         *   * `year`: Year associated with the day.
         * * `date`: Date chosen
         *   * `year`: Year selected
         *   * `month`: Month selected (0-indexed)
         *   * `day`: Day of month selected
         * * `time`: Chosen time (hours/minutes/seconds)
         *   * `hours`: Hours chosen
         *   * `minutes`: Minutes chosen
         *   * `seconds`: Seconds chosen
         *
         * Months are zero-indexed, day-of-months are one-indexed.
         */
        function DateTimePickerController($scope, now) {
            var year,
                month, // For picker state, not model state
                interacted = false;

            function generateTable() {
                var m = moment.utc({
                        year: year,
                        month: month
                    }).day(0),
                    table = [],
                    row,
                    col;

                for (row = 0; row < 6; row += 1) {
                    table.push([]);
                    for (col = 0; col < 7; col += 1) {
                        table[row].push({
                            year: m.year(),
                            month: m.month(),
                            day: m.date(),
                            dayOfYear: m.dayOfYear()
                        });
                        m.add(1, 'days'); // Next day!
                    }
                }

                return table;
            }

            function updateScopeForMonth() {
                $scope.month = MONTHS[month];
                $scope.year = year;
                $scope.table = generateTable();
            }

            function updateFromModel(ngModel) {
                var m;

                m = moment.utc(ngModel);

                $scope.date = {
                    year: m.year(),
                    month: m.month(),
                    day: m.date()
                };
                $scope.time = {
                    hours: m.hour(),
                    minutes: m.minute(),
                    seconds: m.second()
                };

                //window.alert($scope.date.day + " " + ngModel);

                // Zoom to that date in the picker, but
                // only if the user hasn't interacted with it yet.
                if (!interacted) {
                    year = m.year();
                    month = m.month();
                    updateScopeForMonth();
                }
            }

            function updateFromView() {
                var m = moment.utc({
                    year: $scope.date.year,
                    month: $scope.date.month,
                    day: $scope.date.day,
                    hour: $scope.time.hours,
                    minute: $scope.time.minutes,
                    second: $scope.time.seconds
                });
                $scope.ngModel[$scope.field] = m.valueOf();
            }

            $scope.isInCurrentMonth = function (cell) {
                return cell.month === month;
            };

            $scope.isSelected = function (cell) {
                var date = $scope.date || {};

                return cell.day === date.day
                    && cell.month === date.month
                    && cell.year === date.year;
            };

            $scope.select = function (cell) {
                $scope.date = $scope.date || {};
                $scope.date.month = cell.month;
                $scope.date.year = cell.year;
                $scope.date.day = cell.day;
                updateFromView();
            };

            $scope.dateEquals = function (d1, d2) {
                return d1.year === d2.year
                    && d1.month === d2.month
                    && d1.day === d2.day;
            };

            $scope.changeMonth = function (delta) {
                month += delta;
                if (month > 11) {
                    month = 0;
                    year += 1;
                }

                if (month < 0) {
                    month = 11;
                    year -= 1;
                }

                interacted = true;
                updateScopeForMonth();
            };

            $scope.nameFor = function (key) {
                return TIME_NAMES[key];
            };

            $scope.optionsFor = function (key) {
                return TIME_OPTIONS[key];
            };

            updateScopeForMonth();

            // Ensure some useful default
            $scope.ngModel[$scope.field] =
                $scope.ngModel[$scope.field] === undefined
                    ? now() : $scope.ngModel[$scope.field];

            $scope.$watch('ngModel[field]', updateFromModel);
            $scope.$watchCollection('date', updateFromView);
            $scope.$watchCollection('time', updateFromView);
        }

        return DateTimePickerController;
    }
);
