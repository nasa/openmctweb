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
        './SortedTableRowCollection'
    ],
    function (
        SortedTableRowCollection
    ) {
        class FilteredTableRowCollection extends SortedTableRowCollection {
            constructor(masterCollection) {
                super();

                this.masterCollection = masterCollection;
                this.columnFilters = {};

                //Synchronize with master collection
                this.masterCollection.on('add', this.add);
                this.masterCollection.on('remove', this.remove);

                //Default to master collection's sort options
                this.sortOptions = masterCollection.sortBy();
            }

            setColumnFilter(columnKey, filter) {
                filter = filter.trim().toLowerCase();

                let rowsToFilter = this.getRowsToFilter(columnKey, filter);

                if (filter.length === 0) {
                    delete this.columnFilters[columnKey];
                } else {
                    this.columnFilters[columnKey] = filter;
                }

                this.rows = rowsToFilter.filter(this.matchesFilters, this);
                this.emit('filter');
            }

            setColumnRegexFilter(columnKey, filter) {
                filter = filter.trim();

                let rowsToFilter = this.masterCollection.getRows();

                this.columnFilters[columnKey] = new RegExp(filter);
                this.rows = rowsToFilter.filter(this.matchesFilters, this);
                this.emit('filter');
            }

            /**
             * @private
             */
            getRowsToFilter(columnKey, filter) {
                if (this.isSubsetOfCurrentFilter(columnKey, filter)) {
                    return this.getRows();
                } else {
                    return this.masterCollection.getRows();
                }
            }

            /**
             * @private
             */
            isSubsetOfCurrentFilter(columnKey, filter) {
                if (this.columnFilters[columnKey] instanceof RegExp) {
                    return false;
                }

                return this.columnFilters[columnKey]
                    && filter.startsWith(this.columnFilters[columnKey])
                    // startsWith check will otherwise fail when filter cleared
                    // because anyString.startsWith('') === true
                    && filter !== '';
            }

            addOne(row) {
                return this.matchesFilters(row) && super.addOne(row);
            }

            /**
             * @private
             */
            matchesFilters(row) {
                let doesMatchFilters = true;
                Object.keys(this.columnFilters).forEach((key) => {
                    if (!doesMatchFilters || !this.rowHasColumn(row, key)) {
                        return false;
                    }

                    let formattedValue = row.getFormattedValue(key);
                    if (formattedValue === undefined) {
                        return false;
                    }

                    if (this.columnFilters[key] instanceof RegExp) {
                        doesMatchFilters = this.columnFilters[key].test(formattedValue);
                    } else {
                        doesMatchFilters = formattedValue.toLowerCase().indexOf(this.columnFilters[key]) !== -1;
                    }
                });

                return doesMatchFilters;
            }

            rowHasColumn(row, key) {
                return Object.prototype.hasOwnProperty.call(row.columns, key);
            }

            destroy() {
                this.masterCollection.off('add', this.add);
                this.masterCollection.off('remove', this.remove);
            }
        }

        return FilteredTableRowCollection;
    });
