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

        /**
         * Supports TelemetrySubscription. Provides a simple data structure
         * (with a pool-like interface) that aggregates key-value pairs into
         * a queued series of large objects, ensuring that no value is
         * overwritten (but consolidated non-overlapping keys into single
         * objects.)
         * @memberof platform/telemetry
         * @constructor
         * @implements {platform/telemetry.TelemetryPool}
         */
        function TelemetryQueue() {
            // General approach here:
            // * Maintain a queue as an array of objects containing key-value
            //   pairs. Putting values into the queue will assign to the
            //   earliest-available queue position for the associated key
            //   (appending to the array if necessary.)
            // * Maintain a set of counts for each key, such that determining
            //   the next available queue position is easy; O(1) insertion.
            // * When retrieving objects, pop off the queue and decrement
            //   counts. This provides O(n+k) or O(k) retrieval for a queue
            //   of length n with k unique keys; this depends on whether
            //   the browser's implementation of Array.prototype.shift is
            //   O(n) or O(1).

            // Graphically (indexes at top, keys along side, values as *'s),
            // if we have a queue that looks like:
            //   0 1 2 3 4
            // a * * * * *
            // b * *
            // c * * *
            //
            // And we put a new value for b, we expect:
            //   0 1 2 3 4
            // a * * * * *
            // b * * *
            // c * * *

            this.queue = [];
            this.counts = {};
        }

        TelemetryQueue.prototype.isEmpty = function () {
            return this.queue.length < 1;
        };

        TelemetryQueue.prototype.poll = function () {
            var counts = this.counts;

            // Decrement counts for a specific key
            function decrementCount(key) {
                if (counts[key] < 2) {
                    delete counts[key];
                } else {
                    counts[key] -= 1;
                }
            }

            // Decrement counts for the object that will be popped
            Object.keys(counts).forEach(decrementCount);

            return this.queue.shift();
        };

        TelemetryQueue.prototype.put = function (key, value) {
            var queue = this.queue,
                counts = this.counts;

            // Look up an object in the queue that does not have a value
            // assigned to this key (or, add a new one)
            function getFreeObject(k) {
                var index = counts[k] || 0, object;

                // Track the largest free position for this key
                counts[k] = index + 1;

                // If it's before the end of the queue, add it there
                if (index < queue.length) {
                    return queue[index];
                }

                // Otherwise, values have been assigned
                // to that key in all queued containers, so we need to queue
                // up a new  container for key-value pairs.
                object = {};
                queue.push(object);

                return object;
            }

            getFreeObject(key)[key] = value;
        };

        return TelemetryQueue;
    }
);
