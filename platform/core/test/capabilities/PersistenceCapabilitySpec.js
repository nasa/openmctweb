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
/**
 * PersistenceCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/PersistenceCapability"],
    function (PersistenceCapability) {

        describe("The persistence capability", function () {
            var mockPersistenceService,
                mockIdentifierService,
                mockDomainObject,
                mockIdentifier,
                mockNofificationService,
                mockCacheService,
                mockQ,
                key = "persistence key",
                id = "object identifier",
                model,
                SPACE = "some space",
                persistence,
                mockOpenMCT,
                mockNewStyleDomainObject;

            function asPromise(value, doCatch) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    },
                    catch: function (callback) {
                        //Define a default 'happy' catch, that skips over the
                        // catch callback
                        return doCatch ? asPromise(callback(value)) : asPromise(value);
                    }
                };
            }

            beforeEach(function () {
                model = {
                    someKey: "some value",
                    name: "domain object"
                };

                mockPersistenceService = jasmine.createSpyObj(
                    "persistenceService",
                    ["updateObject", "readObject", "createObject", "deleteObject"]
                );

                mockIdentifierService = jasmine.createSpyObj(
                    'identifierService',
                    ['parse', 'generate']
                );
                mockIdentifier = jasmine.createSpyObj(
                    'identifier',
                    ['getSpace', 'getKey', 'getDefinedSpace']
                );
                mockQ = jasmine.createSpyObj(
                    "$q",
                    ["reject", "when"]
                );
                mockNofificationService = jasmine.createSpyObj(
                    "notificationService",
                    ["error"]
                );
                mockCacheService = jasmine.createSpyObj(
                    "cacheService",
                    ["get", "put", "remove", "all"]
                );

                mockDomainObject = {
                    getId: function () {
                        return id;
                    },
                    getModel: function () {
                        return model;
                    },
                    useCapability: jasmine.createSpy()
                };

                mockNewStyleDomainObject = Object.assign({}, model);
                mockNewStyleDomainObject.identifier = {
                    namespace: SPACE,
                    key: key
                };

                // Simulate mutation capability
                mockDomainObject.useCapability.and.callFake(function (capability, mutator) {
                    if (capability === 'mutation') {
                        model = mutator(model) || model;
                    }
                });

                mockOpenMCT = {};
                mockOpenMCT.objects = jasmine.createSpyObj('Object API', ['save']);

                mockIdentifierService.parse.and.returnValue(mockIdentifier);
                mockIdentifier.getSpace.and.returnValue(SPACE);
                mockIdentifier.getKey.and.returnValue(key);
                mockQ.when.and.callFake(asPromise);
                persistence = new PersistenceCapability(
                    mockCacheService,
                    mockPersistenceService,
                    mockIdentifierService,
                    mockNofificationService,
                    mockQ,
                    mockOpenMCT,
                    mockDomainObject
                );
            });

            describe("successful persistence", function () {
                beforeEach(function () {
                    mockOpenMCT.objects.save.and.returnValue(Promise.resolve(true));
                });
                it("creates unpersisted objects with the persistence service", function () {
                    // Verify precondition; no call made during constructor
                    expect(mockOpenMCT.objects.save).not.toHaveBeenCalled();

                    persistence.persist();

                    expect(mockOpenMCT.objects.save).toHaveBeenCalledWith(mockNewStyleDomainObject);
                });

                it("reports which persistence space an object belongs to", function () {
                    expect(persistence.getSpace()).toEqual(SPACE);
                });

                it("refreshes the domain object model from persistence", function () {
                    var refreshModel = {someOtherKey: "some other value"};
                    model.persisted = 1;
                    mockPersistenceService.readObject.and.returnValue(asPromise(refreshModel));
                    persistence.refresh();
                    expect(model).toEqual(refreshModel);
                });

                it("does not trigger error notification on successful"
                    + " persistence", function () {
                    let rejected = false;

                    return persistence.persist()
                        .catch(() => rejected = true)
                        .then(() => {
                            expect(rejected).toBe(false);
                            expect(mockNofificationService.error).not.toHaveBeenCalled();
                        });
                });
            });

            describe("unsuccessful persistence", function () {
                beforeEach(function () {
                    mockOpenMCT.objects.save.and.returnValue(Promise.resolve(false));
                });
                it("rejects on falsey persistence result", function () {
                    let rejected = false;

                    return persistence.persist()
                        .catch(() => rejected = true)
                        .then(() => {
                            expect(rejected).toBe(true);
                        });
                });

                it("notifies user on persistence failure", function () {
                    let rejected = false;

                    return persistence.persist()
                        .catch(() => rejected = true)
                        .then(() => {
                            expect(rejected).toBe(true);
                            expect(mockNofificationService.error).toHaveBeenCalled();
                        });
                });
            });
        });
    }
);
