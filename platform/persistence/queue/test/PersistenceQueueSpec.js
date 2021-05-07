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
    ["../src/PersistenceQueue"],
    function (PersistenceQueue) {

        describe("The persistence queue", function () {
            var mockQ,
                mockTimeout,
                mockDialogService,
                queue;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ['defer']);
                mockTimeout = jasmine.createSpy("$timeout");
                mockDialogService = jasmine.createSpyObj(
                    'dialogService',
                    ['getUserChoice']
                );
                queue = new PersistenceQueue(mockQ, mockTimeout, mockDialogService);
            });

            // PersistenceQueue is just responsible for handling injected
            // dependencies and wiring the PersistenceQueueImpl and its
            // handlers. Functionality is tested there, so our test here is
            // minimal (get back expected interface, no exceptions)
            it("provides a queue with a put method", function () {
                expect(queue.put).toEqual(jasmine.any(Function));
            });

        });
    }
);
