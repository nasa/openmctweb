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
    ["../../src/register/ExtensionSorter"],
    function (ExtensionSorter) {

        describe("The extension sorter", function () {
            var mockLog,
                sorter;

            beforeEach(function () {
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "debug", "info"]
                );

                sorter = new ExtensionSorter(mockLog);
            });

            it("sorts extensions in priority order", function () {
                var a = { priority: 10 },
                    b = {},
                    c = { priority: 'mandatory' }; // Should be +Inf
                expect(sorter.sort([a, b, c])).toEqual([c, a, b]);
            });

            it("warns about unrecognized priorities", function () {
                var a = { priority: 10 },
                    b = {},
                    c = { priority: 'mandatory' }, // Should be +Inf
                    d = { priority: 'GARBAGE-TEXT' },
                    e = { priority: { mal: "formed"} },
                    f = { priority: 3 };

                // Sorting should use default order (note we assume
                // a stable sort here as well)
                expect(sorter.sort(
                    [a, b, c, d, e, f]
                )).toEqual(
                    [c, a, f, b, d, e]
                );

                // Should have been warned exactly twice (for d & e)
                expect(mockLog.warn.calls.count()).toEqual(2);
            });

        });
    }
);
