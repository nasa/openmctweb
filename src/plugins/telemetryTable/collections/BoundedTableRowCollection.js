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
        './SortedTableRowCollection'
    ],
    function (
        _,
        SortedTableRowCollection
    ) {

        class BoundedTableRowCollection extends SortedTableRowCollection {
            constructor(openmct) {
                super();

                this.futureBuffer = new SortedTableRowCollection();
                this.openmct = openmct;

                this.sortByTimeSystem = this.sortByTimeSystem.bind(this);
                this.bounds = this.bounds.bind(this);

                this.sortByTimeSystem(openmct.time.timeSystem());

                this.lastBounds = openmct.time.bounds();

                this.subscribeToBounds();
            }

            addOne(item) {
                let parsedValue = this.getValueForSortColumn(item);
                // Insert into either in-bounds array, or the future buffer.
                // Data in the future buffer will be re-evaluated for possible
                // insertion on next bounds change
                let beforeStartOfBounds = parsedValue < this.lastBounds.start;
                let afterEndOfBounds = parsedValue > this.lastBounds.end;

                if (!afterEndOfBounds && !beforeStartOfBounds) {
                    return super.addOne(item);
                } else if (afterEndOfBounds) {
                    this.futureBuffer.addOne(item);
                }

                return false;
            }

            sortByTimeSystem(timeSystem) {
                this.sortBy({
                    key: timeSystem.key,
                    direction: 'asc'
                });
                let formatter = this.openmct.telemetry.getValueFormatter({
                    key: timeSystem.key,
                    source: timeSystem.key,
                    format: timeSystem.timeFormat
                });
                this.parseTime = formatter.parse.bind(formatter);
                this.futureBuffer.sortBy({
                    key: timeSystem.key,
                    direction: 'asc'
                });
            }

            /**
             * This function is optimized for ticking - it assumes that start and end
             * bounds will only increase and as such this cannot be used for decreasing
             * bounds changes.
             *
             * An implication of this is that data will not be discarded that exceeds
             * the given end bounds. For arbitrary bounds changes, it's assumed that
             * a telemetry requery is performed anyway, and the collection is cleared
             * and repopulated.
             *
             * @fires TelemetryCollection#added
             * @fires TelemetryCollection#discarded
             * @param bounds
             */
            bounds(bounds) {
                let startChanged = this.lastBounds.start !== bounds.start;
                let endChanged = this.lastBounds.end !== bounds.end;

                let startIndex = 0;
                let endIndex = 0;

                let discarded = [];
                let added = [];
                let testValue = {
                    datum: {}
                };

                this.lastBounds = bounds;

                if (startChanged) {
                    testValue.datum[this.sortOptions.key] = bounds.start;
                    // Calculate the new index of the first item within the bounds
                    startIndex = this.sortedIndex(this.rows, testValue);
                    discarded = this.rows.splice(0, startIndex);
                }

                if (endChanged) {
                    testValue.datum[this.sortOptions.key] = bounds.end;
                    // Calculate the new index of the last item in bounds
                    endIndex = this.sortedLastIndex(this.futureBuffer.rows, testValue);
                    added = this.futureBuffer.rows.splice(0, endIndex);
                    added.forEach((datum) => this.rows.push(datum));
                }

                if (discarded && discarded.length > 0) {
                    /**
                     * A `discarded` event is emitted when telemetry data fall out of
                     * bounds due to a bounds change event
                     * @type {object[]} discarded the telemetry data
                     * discarded as a result of the bounds change
                     */
                    this.emit('remove', discarded);
                }

                if (added && added.length > 0) {
                    /**
                     * An `added` event is emitted when a bounds change results in
                     * received telemetry falling within the new bounds.
                     * @type {object[]} added the telemetry data that is now within bounds
                     */
                    this.emit('add', added);
                }
            }

            getValueForSortColumn(row) {
                return this.parseTime(row.datum[this.sortOptions.key]);
            }

            unsubscribeFromBounds() {
                this.openmct.time.off('bounds', this.bounds);
            }

            subscribeToBounds() {
                this.openmct.time.on('bounds', this.bounds);
            }

            destroy() {
                this.unsubscribeFromBounds();
            }
        }

        return BoundedTableRowCollection;
    });
