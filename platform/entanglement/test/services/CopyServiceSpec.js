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
        '../../src/services/CopyService',
        '../DomainObjectFactory'
    ],
    function (CopyService, domainObjectFactory) {

        function synchronousPromise(value) {
            if (value && value.then) {
                return value;
            }

            var promise = {
                then: function (callback) {
                    return synchronousPromise(callback(value));
                }
            };
            spyOn(promise, 'then').and.callThrough();

            return promise;
        }

        xdescribe("CopyService", function () {
            var policyService;

            beforeEach(function () {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
            });

            describe("validate", function () {

                var copyService,
                    object,
                    parentCandidate,
                    validate;

                beforeEach(function () {
                    copyService = new CopyService(
                        null,
                        policyService
                    );
                    object = domainObjectFactory({
                        name: 'object',
                        capabilities: {
                            type: { type: 'object' }
                        }
                    });
                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate',
                        capabilities: {
                            type: { type: 'parentCandidate' }
                        }
                    });
                    validate = function () {
                        return copyService.validate(object, parentCandidate);
                    };
                });

                it("does not allow invalid parentCandidate", function () {
                    parentCandidate = undefined;
                    expect(validate()).toBe(false);
                    parentCandidate = {};
                    expect(validate()).toBe(false);
                });

                it("does not allow copying into source object", function () {
                    object.id = parentCandidate.id = 'abc';
                    expect(validate()).toBe(false);
                });

                describe("defers to policyService", function () {
                    beforeEach(function () {
                        object.id = 'a';
                        parentCandidate.id = 'b';
                    });

                    it("calls policy service with correct args", function () {
                        validate();
                        expect(policyService.allow).toHaveBeenCalledWith(
                            "composition",
                            parentCandidate,
                            object
                        );
                    });

                    it("and returns false", function () {
                        policyService.allow.and.returnValue(false);
                        expect(validate()).toBe(false);
                    });

                    it("and returns true", function () {
                        policyService.allow.and.returnValue(true);
                        expect(validate()).toBe(true);
                    });
                });
            });

            describe("perform", function () {

                var mockQ,
                    mockDeferred,
                    copyService,
                    object,
                    newParent,
                    copyResult,
                    copyFinished,
                    persistObjectPromise,
                    persistenceCapability,
                    instantiationCapability,
                    compositionCapability,
                    locationCapability,
                    resolvedValue;

                beforeEach(function () {
                    policyService.allow.and.returnValue(true);

                    persistObjectPromise = synchronousPromise(undefined);

                    instantiationCapability = jasmine.createSpyObj(
                        "instantiation",
                        ["invoke"]
                    );

                    persistenceCapability = jasmine.createSpyObj(
                        "persistenceCapability",
                        ["persist", "getSpace"]
                    );
                    persistenceCapability.persist.and.returnValue(persistObjectPromise);

                    compositionCapability = jasmine.createSpyObj(
                        'compositionCapability',
                        ['invoke', 'add']
                    );
                    compositionCapability.add.and.callFake(synchronousPromise);

                    locationCapability = jasmine.createSpyObj(
                        'locationCapability',
                        ['isLink']
                    );
                    locationCapability.isLink.and.returnValue(false);

                    mockDeferred = jasmine.createSpyObj(
                        'mockDeferred',
                        ['notify', 'resolve', 'reject']
                    );
                    mockDeferred.notify.and.callFake(function () {});
                    mockDeferred.resolve.and.callFake(function (value) {
                        resolvedValue = value;
                    });
                    mockDeferred.promise = {
                        then: function (callback) {
                            return synchronousPromise(callback(resolvedValue));
                        }
                    };

                    mockQ = jasmine.createSpyObj(
                        'mockQ',
                        ['when', 'all', 'reject', 'defer']
                    );
                    mockQ.reject.and.returnValue(synchronousPromise(undefined));
                    mockQ.when.and.callFake(synchronousPromise);
                    mockQ.all.and.callFake(function (promises) {
                        var result = {};
                        Object.keys(promises).forEach(function (k) {
                            promises[k].then(function (v) {
                                result[k] = v;
                            });
                        });

                        return synchronousPromise(result);
                    });
                    mockQ.defer.and.returnValue(mockDeferred);

                });

                describe("on domain object without composition", function () {
                    beforeEach(function () {
                        var objectCopy;

                        newParent = domainObjectFactory({
                            name: 'newParent',
                            id: '456',
                            model: {
                                composition: []
                            },
                            capabilities: {
                                instantiation: instantiationCapability,
                                persistence: persistenceCapability,
                                composition: compositionCapability
                            }
                        });

                        object = domainObjectFactory({
                            name: 'object',
                            id: 'abc',
                            model: {
                                name: 'some object',
                                location: '456',
                                someOtherAttribute: 'some other value',
                                embeddedObjectAttribute: {
                                    name: 'Some embedded object'
                                }
                            },
                            capabilities: {
                                persistence: persistenceCapability
                            }
                        });

                        objectCopy = domainObjectFactory({
                            name: 'object',
                            id: 'abc.copy.fdgdfgdf',
                            capabilities: {
                                persistence: persistenceCapability,
                                location: locationCapability
                            }
                        });

                        instantiationCapability.invoke.and.callFake(
                            function (model) {
                                objectCopy.model = model;

                                return objectCopy;
                            }
                        );

                        copyService = new CopyService(mockQ, policyService);
                        copyResult = copyService.perform(object, newParent);
                        copyFinished = jasmine.createSpy('copyFinished');
                        copyResult.then(copyFinished);
                    });

                    it("uses persistence capability", function () {
                        expect(persistenceCapability.persist)
                            .toHaveBeenCalled();
                    });

                    it("deep clones object model", function () {
                        var newModel = copyFinished.calls.all()[0].args[0].getModel();
                        expect(newModel).toEqual(object.model);
                        expect(newModel).not.toBe(object.model);
                    });

                    it("returns a promise", function () {
                        expect(copyResult).toBeDefined();
                        expect(copyFinished).toHaveBeenCalled();
                    });

                });

                describe("on domainObject with composition", function () {
                    var childObject,
                        objectClone,
                        childObjectClone;

                    beforeEach(function () {
                        var invocationCount = 0,
                            objectClones;

                        instantiationCapability.invoke.and.callFake(
                            function (model) {
                                var cloneToReturn = objectClones[invocationCount++];
                                cloneToReturn.model = model;

                                return cloneToReturn;
                            }
                        );

                        newParent = domainObjectFactory({
                            name: 'newParent',
                            id: '456',
                            model: {
                                composition: []
                            },
                            capabilities: {
                                instantiation: instantiationCapability,
                                persistence: persistenceCapability,
                                composition: compositionCapability
                            }
                        });

                        childObject = domainObjectFactory({
                            name: 'childObject',
                            id: 'def',
                            model: {
                                name: 'a child object',
                                location: 'abc'
                            },
                            capabilities: {
                                persistence: persistenceCapability,
                                location: locationCapability
                            }
                        });

                        childObjectClone = domainObjectFactory({
                            name: 'childObject',
                            id: 'def.clone',
                            capabilities: {
                                persistence: persistenceCapability,
                                location: locationCapability
                            }
                        });

                        compositionCapability
                            .invoke
                            .and.returnValue(synchronousPromise([childObject]));

                        object = domainObjectFactory({
                            name: 'some object',
                            id: 'abc',
                            model: {
                                name: 'some object',
                                composition: ['def'],
                                location: 'testLocation'
                            },
                            capabilities: {
                                instantiation: instantiationCapability,
                                composition: compositionCapability,
                                location: locationCapability,
                                persistence: persistenceCapability
                            }
                        });

                        objectClone = domainObjectFactory({
                            name: 'some object',
                            id: 'abc.clone',
                            capabilities: {
                                instantiation: instantiationCapability,
                                composition: compositionCapability,
                                location: locationCapability,
                                persistence: persistenceCapability
                            }
                        });

                        objectClones = [objectClone, childObjectClone];

                        copyService = new CopyService(mockQ, policyService);
                    });

                    describe("the cloning process", function () {
                        beforeEach(function () {
                            copyResult = copyService.perform(object, newParent);
                            copyFinished = jasmine.createSpy('copyFinished');
                            copyResult.then(copyFinished);
                        });

                        it("returns a promise", function () {
                            expect(copyResult.then).toBeDefined();
                            expect(copyFinished).toHaveBeenCalled();
                        });

                        it("returns a promise", function () {
                            expect(copyResult.then).toBeDefined();
                            expect(copyFinished).toHaveBeenCalled();
                        });

                        it ("correctly locates cloned objects", function () {
                            expect(childObjectClone.getModel().location).toEqual(objectClone.getId());
                        });
                    });

                    describe("when cloning non-creatable objects", function () {
                        beforeEach(function () {
                            policyService.allow.and.callFake(function (category) {
                                //Return false for 'creation' policy
                                return category !== 'creation';
                            });

                            copyResult = copyService.perform(object, newParent);
                            copyFinished = jasmine.createSpy('copyFinished');
                            copyResult.then(copyFinished);
                        });
                        it ("creates link instead of clone", function () {
                            var copiedObject = copyFinished.calls.all()[0].args[0];
                            expect(copiedObject).toBe(object);
                            expect(compositionCapability.add)
                                .toHaveBeenCalledWith(copiedObject);
                        });
                    });

                    describe("when provided a filtering function", function () {
                        beforeEach(function () {
                            copyFinished = jasmine.createSpy('copyFinished');
                        });

                        function accept() {
                            return true;
                        }

                        function reject() {
                            return false;
                        }

                        it("does not create new instances of objects "
                            + "rejected by the filter", function () {
                            copyService.perform(object, newParent, reject)
                                .then(copyFinished);
                            expect(copyFinished.calls.mostRecent().args[0])
                                .toBe(object);
                        });

                        it("does create new instances of objects "
                            + "accepted by the filter", function () {
                            copyService.perform(object, newParent, accept)
                                .then(copyFinished);
                            expect(copyFinished.calls.mostRecent().args[0])
                                .not.toBe(object);
                        });
                    });
                });

                describe("on invalid inputs", function () {
                    beforeEach(function () {
                        object = domainObjectFactory({
                            name: 'object',
                            capabilities: {
                                type: { type: 'object' },
                                location: locationCapability,
                                persistence: persistenceCapability
                            }
                        });

                        newParent = domainObjectFactory({
                            name: 'parentCandidate',
                            capabilities: {
                                type: { type: 'parentCandidate' },
                                instantiation: instantiationCapability,
                                composition: compositionCapability,
                                persistence: persistenceCapability
                            }
                        });

                        instantiationCapability.invoke.and.returnValue(object);
                    });

                    it("throws an error", function () {
                        var service =
                            new CopyService(mockQ, policyService);

                        function perform() {
                            service.perform(object, newParent);
                        }

                        spyOn(service, "validate");
                        service.validate.and.returnValue(true);
                        expect(perform).not.toThrow();
                        service.validate.and.returnValue(false);
                        expect(perform).toThrow();
                    });
                });

            });
        });
    }
);
