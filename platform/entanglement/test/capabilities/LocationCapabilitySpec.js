/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
        '../../src/capabilities/LocationCapability',
        '../DomainObjectFactory',
        '../ControlledPromise'
    ],
    (LocationCapability, domainObjectFactory, ControlledPromise) => {

        describe("LocationCapability", () =>  {

            describe("instantiated with domain object", () =>  {
                let locationCapability,
                    mutationPromise,
                    mockQ,
                    mockInjector,
                    mockObjectService,
                    domainObject;

                beforeEach(() =>  {
                    domainObject = domainObjectFactory({
                        id: "testObject",
                        capabilities: {
                            context: {
                                getParent: () =>  {
                                    return domainObjectFactory({id: 'root'});
                                }
                            },
                            mutation: jasmine.createSpyObj(
                                'mutationCapability',
                                ['invoke']
                            )
                        }
                    });

                    mockQ = jasmine.createSpyObj("$q", ["when"]);
                    mockInjector = jasmine.createSpyObj("$injector", ["get"]);
                    mockObjectService =
                        jasmine.createSpyObj("objectService", ["getObjects"]);

                    mutationPromise = new ControlledPromise();
                    domainObject.capabilities.mutation.invoke.andCallFake(
                        (mutator) => {
                            return mutationPromise.then(() =>  {
                                mutator(domainObject.model);
                            });
                        }
                    );

                    locationCapability = new LocationCapability(
                        mockQ,
                        mockInjector,
                        domainObject
                    );
                });

                it("returns contextual location", () =>  {
                    expect(locationCapability.getContextualLocation())
                        .toBe('root');
                });

                it("knows when the object is an original", () =>  {
                    domainObject.model.location = 'root';
                    expect(locationCapability.isOriginal()).toBe(true);
                    expect(locationCapability.isLink()).toBe(false);
                });

                it("knows when the object is a link.", () =>  {
                    domainObject.model.location = 'different-root';
                    expect(locationCapability.isLink()).toBe(true);
                    expect(locationCapability.isOriginal()).toBe(false);
                });

                it("can mutate location", () =>  {
                    let result = locationCapability
                            .setPrimaryLocation('root'),
                        whenComplete = jasmine.createSpy('whenComplete');

                    result.then(whenComplete);

                    expect(domainObject.model.location).not.toBeDefined();
                    mutationPromise.resolve();
                    expect(domainObject.model.location).toBe('root');

                    expect(whenComplete).toHaveBeenCalled();
                });

                describe("when used to load an original instance", () =>  {
                    let objectPromise,
                        qPromise,
                        originalObjects,
                        mockCallback;

                    const resolvePromises = () => {
                        if (mockQ.when.calls.length > 0) {
                            qPromise.resolve(mockQ.when.mostRecentCall.args[0]);
                        }
                        if (mockObjectService.getObjects.calls.length > 0) {
                            objectPromise.resolve(originalObjects);
                        }
                    }

                    beforeEach(() =>  {
                        objectPromise = new ControlledPromise();
                        qPromise = new ControlledPromise();
                        originalObjects = {
                            testObject: domainObjectFactory()
                        };

                        mockInjector.get.andCallFake( (key) => {
                            return key === 'objectService' && mockObjectService;
                        });
                        mockObjectService.getObjects.andReturn(objectPromise);
                        mockQ.when.andReturn(qPromise);

                        mockCallback = jasmine.createSpy('callback');
                    });

                    it("provides originals directly", () =>  {
                        domainObject.model.location = 'root';
                        locationCapability.getOriginal().then(mockCallback);
                        expect(mockCallback).not.toHaveBeenCalled();
                        resolvePromises();
                        expect(mockCallback)
                            .toHaveBeenCalledWith(domainObject);
                    });

                    it("loads from the object service for links", () =>  {
                        domainObject.model.location = 'some-other-root';
                        locationCapability.getOriginal().then(mockCallback);
                        expect(mockCallback).not.toHaveBeenCalled();
                        resolvePromises();
                        expect(mockCallback)
                            .toHaveBeenCalledWith(originalObjects.testObject);
                    });
                });


            });
        });
    }
);
