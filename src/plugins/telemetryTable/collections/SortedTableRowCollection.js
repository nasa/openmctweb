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
    [
        'lodash',
        'EventEmitter'
    ],
    function (
        _,
        EventEmitter
    ) {
        const LESS_THAN = -1;
        const EQUAL = 0;
        const GREATER_THAN = 1;

        /**
         * @constructor
         */
        class SortedTableRowCollection extends EventEmitter {
            constructor() {
                super();

                this.dupeCheck = false;
                this.rows = [];

                this.add = this.add.bind(this);
                this.remove = this.remove.bind(this);
            }

            /**
             * Add a datum or array of data to this telemetry collection
             * @fires TelemetryCollection#added
             * @param {object | object[]} rows
             */
            add(rows) {
                if (Array.isArray(rows)) {
                    this.dupeCheck = false;

                    let rowsAdded = rows.filter(this.addOne, this);
                    if (rowsAdded.length > 0) {
                        this.emit('add', rowsAdded);
                    }

                    this.dupeCheck = true;
                } else {
                    let wasAdded = this.addOne(rows);
                    if (wasAdded) {
                        this.emit('add', rows);
                    }
                }
            }

            /**
             * @private
             */
            addOne(row) {
                if (this.sortOptions === undefined) {
                    throw 'Please specify sort options';
                }

                let isDuplicate = false;

                // Going to check for duplicates. Bound the search problem to
                // items around the given time. Use sortedIndex because it
                // employs a binary search which is O(log n). Can use binary search
                // because the array is guaranteed ordered due to sorted insertion.
                let startIx = this.sortedIndex(this.rows, row);
                let endIx = undefined;

                if (this.dupeCheck && startIx !== this.rows.length) {
                    endIx = this.sortedLastIndex(this.rows, row);

                    // Create an array of potential dupes, based on having the
                    // same time stamp
                    let potentialDupes = this.rows.slice(startIx, endIx + 1);
                    // Search potential dupes for exact dupe
                    isDuplicate = potentialDupes.some(_.isEqual.bind(undefined, row));
                }

                if (!isDuplicate) {
                    this.rows.splice(endIx || startIx, 0, row);

                    return true;
                }

                return false;
            }

            sortedLastIndex(rows, testRow) {
                return this.sortedIndex(rows, testRow, _.sortedLastIndex);
            }
            /**
             * Finds the correct insertion point for the given row.
             * Leverages lodash's `sortedIndex` function which implements a binary search.
             * @private
             */
            sortedIndex(rows, testRow, lodashFunction) {
                if (this.rows.length === 0) {
                    return 0;
                }

                const testRowValue = this.getValueForSortColumn(testRow);
                const firstValue = this.getValueForSortColumn(this.rows[0]);
                const lastValue = this.getValueForSortColumn(this.rows[this.rows.length - 1]);

                lodashFunction = lodashFunction || _.sortedIndexBy;

                if (this.sortOptions.direction === 'asc') {
                    if (testRowValue > lastValue) {
                        return this.rows.length;
                    } else if (testRowValue === lastValue) {
                        // Maintain stable sort
                        return this.rows.length;
                    } else if (testRowValue <= firstValue) {
                        return 0;
                    } else {
                        return lodashFunction(rows, testRow, (thisRow) => {
                            return this.getValueForSortColumn(thisRow);
                        });
                    }
                } else {
                    if (testRowValue >= firstValue) {
                        return 0;
                    } else if (testRowValue < lastValue) {
                        return this.rows.length;
                    } else if (testRowValue === lastValue) {
                        // Maintain stable sort
                        return this.rows.length;
                    } else {
                        // Use a custom comparison function to support descending sort.
                        return lodashFunction(rows, testRow, (thisRow) => {
                            const thisRowValue = this.getValueForSortColumn(thisRow);
                            if (testRowValue === thisRowValue) {
                                return EQUAL;
                            } else if (testRowValue < thisRowValue) {
                                return LESS_THAN;
                            } else {
                                return GREATER_THAN;
                            }
                        });
                    }
                }
            }

            /**
             * Sorts the telemetry collection based on the provided sort field
             * specifier. Subsequent inserts are sorted to maintain specified sport
             * order.
             *
             * @example
             * // First build some mock telemetry for the purpose of an example
             * let now = Date.now();
             * let telemetry = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (value) {
             *     return {
             *         // define an object property to demonstrate nested paths
             *         timestamp: {
             *             ms: now - value * 1000,
             *             text:
             *         },
             *         value: value
             *     }
             * });
             * let collection = new TelemetryCollection();
             *
             * collection.add(telemetry);
             *
             * // Sort by telemetry value
             * collection.sortBy({
             *  key: 'value', direction: 'asc'
             * });
             *
             * // Sort by ms since epoch
             * collection.sort({
             *  key: 'timestamp.ms',
             *  direction: 'asc'
             * });
             *
             * // Sort by 'text' attribute, descending
             * collection.sort("timestamp.text");
             *
             *
             * @param {object} sortOptions An object specifying a sort key, and direction.
             */
            sortBy(sortOptions) {
                if (arguments.length > 0) {
                    this.sortOptions = sortOptions;
                    this.rows = _.orderBy(this.rows, (row) => row.getParsedValue(sortOptions.key), sortOptions.direction);
                    this.emit('sort');
                }

                // Return duplicate to avoid direct modification of underlying object
                return Object.assign({}, this.sortOptions);
            }

            removeAllRowsForObject(objectKeyString) {
                let removed = [];
                this.rows = this.rows.filter(row => {
                    if (row.objectKeyString === objectKeyString) {
                        removed.push(row);

                        return false;
                    }

                    return true;
                });

                this.emit('remove', removed);
            }

            getValueForSortColumn(row) {
                return row.getParsedValue(this.sortOptions.key);
            }

            remove(removedRows) {
                this.rows = this.rows.filter(row => {
                    return removedRows.indexOf(row) === -1;
                });

                this.emit('remove', removedRows);
            }

            getRows() {
                return this.rows;
            }

            clear() {
                let removedRows = this.rows;
                this.rows = [];

                this.emit('remove', removedRows);
            }
        }

        return SortedTableRowCollection;
    });
