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
    ["../src/QueuingPersistenceCapability"],
    function (QueuingPersistenceCapability) {

        describe("A queuing persistence capability", function () {
            var mockQueue,
                mockPersistence,
                mockDomainObject,
                persistence;

            beforeEach(function () {
                mockQueue = jasmine.createSpyObj('queue', ['put']);
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist', 'refresh']
                );
                mockDomainObject = {};
                persistence = new QueuingPersistenceCapability(
                    mockQueue,
                    mockPersistence,
                    mockDomainObject
                );
            });

            it("puts a request for persistence into the queue on persist", function () {
                // Verify precondition
                expect(mockQueue.put).not.toHaveBeenCalled();
                // Invoke persistence
                persistence.persist();
                // Should have queued
                expect(mockQueue.put).toHaveBeenCalledWith(
                    mockDomainObject,
                    mockPersistence
                );
            });

            it("exposes other methods from the wrapped persistence capability", function () {
                expect(persistence.refresh).toBe(mockPersistence.refresh);
            });
        });
    }
);
