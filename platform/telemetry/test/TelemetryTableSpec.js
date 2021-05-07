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
    ["../src/TelemetryTable"],
    function (TelemetryTable) {

        describe("The telemetry table", function () {
            var queue;

            beforeEach(function () {
                // put, isEmpty, dequeue
                queue = new TelemetryTable();
            });

            it("stores elements by key", function () {
                queue.put("a", { someKey: "some value" });
                expect(queue.poll())
                    .toEqual({ a: { someKey: "some value" }});
            });

            it("merges non-overlapping keys", function () {
                queue.put("a", { someKey: "some value" });
                queue.put("b", 42);
                expect(queue.poll())
                    .toEqual({
                        a: { someKey: "some value" },
                        b: 42
                    });
            });

            it("overwrites repeated keys", function () {
                queue.put("a", { someKey: "some value" });
                queue.put("a", { someKey: "some other value" });
                queue.put("b", 42);
                expect(queue.poll())
                    .toEqual({
                        a: { someKey: "some other value" },
                        b: 42
                    });
                expect(queue.poll())
                    .toBeUndefined();
            });

            it("reports emptiness", function () {
                expect(queue.isEmpty()).toBeTruthy();
                queue.put("a", { someKey: "some value" });
                queue.put("a", { someKey: "some other value" });
                queue.put("b", 42);
                expect(queue.isEmpty()).toBeFalsy();
                queue.poll();
                expect(queue.isEmpty()).toBeTruthy();
            });

        });

    }
);
