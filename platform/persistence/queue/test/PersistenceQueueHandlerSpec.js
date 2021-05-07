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
    ["../src/PersistenceQueueHandler"],
    function (PersistenceQueueHandler) {

        var TEST_ERROR = { someKey: "some value" };

        describe("The persistence queue handler", function () {
            var mockQ,
                mockFailureHandler,
                mockPersistences,
                mockDomainObjects,
                mockQueue,
                mockRejection,
                handler;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function makeMockPersistence(id) {
                var mockPersistence = jasmine.createSpyObj(
                    'persistence-' + id,
                    ['persist', 'refresh']
                );
                mockPersistence.persist.and.returnValue(asPromise(true));

                return mockPersistence;
            }

            function makeMockDomainObject(id) {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject-' + id,
                    ['getId']
                );
                mockDomainObject.getId.and.returnValue(id);

                return mockDomainObject;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['all']);
                mockFailureHandler = jasmine.createSpyObj('handler', ['handle']);
                mockQueue = jasmine.createSpyObj('queue', ['put']);
                mockPersistences = {};
                mockDomainObjects = {};
                ['a', 'b', 'c'].forEach(function (id) {
                    mockPersistences[id] = makeMockPersistence(id);
                    mockDomainObjects[id] = makeMockDomainObject(id);
                });
                mockRejection = jasmine.createSpyObj('rejection', ['then']);
                mockQ.all.and.returnValue(asPromise([]));
                mockRejection.then.and.callFake(function (callback, fallback) {
                    return asPromise(fallback({ someKey: "some value" }));
                });
                handler = new PersistenceQueueHandler(mockQ, mockFailureHandler);
            });

            it("invokes persistence on all members in the group", function () {
                handler.persist(mockPersistences, mockDomainObjects, mockQueue);
                expect(mockPersistences.a.persist).toHaveBeenCalled();
                expect(mockPersistences.b.persist).toHaveBeenCalled();
                expect(mockPersistences.c.persist).toHaveBeenCalled();
                // No failures in this group
                expect(mockFailureHandler.handle).not.toHaveBeenCalled();
            });

            it("handles failures that occur", function () {
                mockPersistences.b.persist.and.returnValue(mockRejection);
                mockPersistences.c.persist.and.returnValue(mockRejection);
                handler.persist(mockPersistences, mockDomainObjects, mockQueue);
                expect(mockFailureHandler.handle).toHaveBeenCalledWith([
                    {
                        id: 'b',
                        persistence: mockPersistences.b,
                        domainObject: mockDomainObjects.b,
                        requeue: jasmine.any(Function),
                        error: TEST_ERROR
                    },
                    {
                        id: 'c',
                        persistence: mockPersistences.c,
                        domainObject: mockDomainObjects.c,
                        requeue: jasmine.any(Function),
                        error: TEST_ERROR
                    }
                ]);
            });

            it("provides a requeue method for failures", function () {
                // This method is needed by PersistenceFailureHandler
                // to allow requeuing of objects for persistence when
                // Overwrite is chosen.
                mockPersistences.b.persist.and.returnValue(mockRejection);
                handler.persist(mockPersistences, mockDomainObjects, mockQueue);

                // Verify precondition
                expect(mockQueue.put).not.toHaveBeenCalled();

                // Invoke requeue
                mockFailureHandler.handle.calls.mostRecent().args[0][0].requeue();

                // Should have returned the object to the queue
                expect(mockQueue.put).toHaveBeenCalledWith(
                    mockDomainObjects.b,
                    mockPersistences.b
                );
            });
        });
    }
);
