import ObjectAPI from './ObjectAPI.js';

describe("The Object API", () => {
    let objectAPI;
    let typeRegistry;
    let openmct = {};
    let mockIdentifierService;
    let mockDomainObject;
    const TEST_NAMESPACE = "test-namespace";
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    beforeEach(() => {
        typeRegistry = jasmine.createSpyObj('typeRegistry', [
            'get'
        ]);
        openmct.$injector = jasmine.createSpyObj('$injector', ['get']);
        mockIdentifierService = jasmine.createSpyObj(
            'identifierService',
            ['parse']
        );
        mockIdentifierService.parse.and.returnValue({
            getSpace: () => {
                return TEST_NAMESPACE;
            }
        });

        openmct.$injector.get.and.returnValue(mockIdentifierService);
        objectAPI = new ObjectAPI(typeRegistry, openmct);
        mockDomainObject = {
            identifier: {
                namespace: TEST_NAMESPACE,
                key: "test-key"
            },
            name: "test object",
            type: "test-type"
        };
    });
    describe("The save function", () => {
        it("Rejects if no provider available", () => {
            let rejected = false;

            return objectAPI.save(mockDomainObject)
                .catch(() => rejected = true)
                .then(() => expect(rejected).toBe(true));
        });
        describe("when a provider is available", () => {
            let mockProvider;
            beforeEach(() => {
                mockProvider = jasmine.createSpyObj("mock provider", [
                    "create",
                    "update"
                ]);
                mockProvider.create.and.returnValue(Promise.resolve(true));
                mockProvider.update.and.returnValue(Promise.resolve(true));
                objectAPI.addProvider(TEST_NAMESPACE, mockProvider);
            });
            it("Calls 'create' on provider if object is new", () => {
                objectAPI.save(mockDomainObject);
                expect(mockProvider.create).toHaveBeenCalled();
                expect(mockProvider.update).not.toHaveBeenCalled();
            });
            it("Calls 'update' on provider if object is not new", () => {
                mockDomainObject.persisted = Date.now() - FIFTEEN_MINUTES;
                mockDomainObject.modified = Date.now();

                objectAPI.save(mockDomainObject);
                expect(mockProvider.create).not.toHaveBeenCalled();
                expect(mockProvider.update).toHaveBeenCalled();
            });

            it("Does not persist if the object is unchanged", () => {
                mockDomainObject.persisted =
                    mockDomainObject.modified = Date.now();

                objectAPI.save(mockDomainObject);
                expect(mockProvider.create).not.toHaveBeenCalled();
                expect(mockProvider.update).not.toHaveBeenCalled();
            });
        });
    });

    describe("The get function", () => {
        describe("when a provider is available", () => {
            let mockProvider;
            let mockInterceptor;
            let anotherMockInterceptor;
            let notApplicableMockInterceptor;
            beforeEach(() => {
                mockProvider = jasmine.createSpyObj("mock provider", [
                    "get"
                ]);
                mockProvider.get.and.returnValue(Promise.resolve(mockDomainObject));

                mockInterceptor = jasmine.createSpyObj("mock interceptor", [
                    "appliesTo",
                    "invoke"
                ]);
                mockInterceptor.appliesTo.and.returnValue(true);
                mockInterceptor.invoke.and.callFake((identifier, object) => {
                    return Object.assign({
                        changed: true
                    }, object);
                });

                anotherMockInterceptor = jasmine.createSpyObj("another mock interceptor", [
                    "appliesTo",
                    "invoke"
                ]);
                anotherMockInterceptor.appliesTo.and.returnValue(true);
                anotherMockInterceptor.invoke.and.callFake((identifier, object) => {
                    return Object.assign({
                        alsoChanged: true
                    }, object);
                });

                notApplicableMockInterceptor = jasmine.createSpyObj("not applicable mock interceptor", [
                    "appliesTo",
                    "invoke"
                ]);
                notApplicableMockInterceptor.appliesTo.and.returnValue(false);
                notApplicableMockInterceptor.invoke.and.callFake((identifier, object) => {
                    return Object.assign({
                        shouldNotBeChanged: true
                    }, object);
                });
                objectAPI.addProvider(TEST_NAMESPACE, mockProvider);
                objectAPI.addGetInterceptor(mockInterceptor);
                objectAPI.addGetInterceptor(anotherMockInterceptor);
                objectAPI.addGetInterceptor(notApplicableMockInterceptor);
            });

            it("Caches multiple requests for the same object", () => {
                expect(mockProvider.get.calls.count()).toBe(0);
                objectAPI.get(mockDomainObject.identifier);
                expect(mockProvider.get.calls.count()).toBe(1);
                objectAPI.get(mockDomainObject.identifier);
                expect(mockProvider.get.calls.count()).toBe(1);
            });

            it("applies any applicable interceptors", () => {
                expect(mockDomainObject.changed).toBeUndefined();
                objectAPI.get(mockDomainObject.identifier).then((object) => {
                    expect(object.changed).toBeTrue();
                    expect(object.alsoChanged).toBeTrue();
                    expect(object.shouldNotBeChanged).toBeUndefined();
                });
            });
        });
    });

    describe("the mutation API", () => {
        let testObject;
        let updatedTestObject;
        let mutable;
        let mockProvider;
        let callbacks = [];

        beforeEach(function () {
            objectAPI = new ObjectAPI(typeRegistry, openmct);
            testObject = {
                identifier: {
                    namespace: TEST_NAMESPACE,
                    key: 'test-key'
                },
                name: 'test object',
                otherAttribute: 'other-attribute-value',
                objectAttribute: {
                    embeddedObject: {
                        embeddedKey: 'embedded-value'
                    }
                }
            };
            updatedTestObject = Object.assign({otherAttribute: 'changed-attribute-value'}, testObject);
            mockProvider = jasmine.createSpyObj("mock provider", [
                "get",
                "create",
                "update",
                "observe",
                "observeObjectChanges"
            ]);
            mockProvider.get.and.returnValue(Promise.resolve(testObject));
            mockProvider.observeObjectChanges.and.callFake(() => {
                callbacks[0](updatedTestObject);
                callbacks.splice(0, 1);
            });
            mockProvider.observe.and.callFake((id, callback) => {
                if (callbacks.length === 0) {
                    callbacks.push(callback);
                } else {
                    callbacks[0] = callback;
                }
            });

            objectAPI.addProvider(TEST_NAMESPACE, mockProvider);

            return objectAPI.getMutable(testObject.identifier)
                .then(object => {
                    mutable = object;

                    return mutable;
                });
        });

        afterEach(() => {
            mutable.$destroy();
        });

        it('mutates the original object', () => {
            const MUTATED_NAME = 'mutated name';
            objectAPI.mutate(testObject, 'name', MUTATED_NAME);
            expect(testObject.name).toBe(MUTATED_NAME);
        });

        describe ('uses a MutableDomainObject', () => {
            it('and retains properties of original object ', function () {
                expect(hasOwnProperty(mutable, 'identifier')).toBe(true);
                expect(hasOwnProperty(mutable, 'otherAttribute')).toBe(true);
                expect(mutable.identifier).toEqual(testObject.identifier);
                expect(mutable.otherAttribute).toEqual(testObject.otherAttribute);
            });

            it('that is identical to original object when serialized', function () {
                expect(JSON.stringify(mutable)).toEqual(JSON.stringify(testObject));
            });

            it('that observes for object changes', function () {
                let mockListener = jasmine.createSpy('mockListener');
                objectAPI.observe(testObject, '*', mockListener);
                mockProvider.observeObjectChanges();
                expect(mockListener).toHaveBeenCalled();
            });
        });

        describe('uses events', function () {
            let testObjectDuplicate;
            let mutableSecondInstance;

            beforeEach(function () {
                // Duplicate object to guarantee we are not sharing object instance, which would invalidate test
                testObjectDuplicate = JSON.parse(JSON.stringify(testObject));
                mutableSecondInstance = objectAPI._toMutable(testObjectDuplicate);
            });

            afterEach(() => {
                mutableSecondInstance.$destroy();
            });

            it('to stay synchronized when mutated', function () {
                objectAPI.mutate(mutable, 'otherAttribute', 'new-attribute-value');
                expect(mutableSecondInstance.otherAttribute).toBe('new-attribute-value');
            });

            it('to indicate when a property changes', function () {
                let mutationCallback = jasmine.createSpy('mutation-callback');
                let unlisten;

                return new Promise(function (resolve) {
                    mutationCallback.and.callFake(resolve);
                    unlisten = objectAPI.observe(mutableSecondInstance, 'otherAttribute', mutationCallback);
                    objectAPI.mutate(mutable, 'otherAttribute', 'some-new-value');
                }).then(function () {
                    expect(mutationCallback).toHaveBeenCalledWith('some-new-value');
                    unlisten();
                });
            });

            it('to indicate when a child property has changed', function () {
                let embeddedKeyCallback = jasmine.createSpy('embeddedKeyCallback');
                let embeddedObjectCallback = jasmine.createSpy('embeddedObjectCallback');
                let objectAttributeCallback = jasmine.createSpy('objectAttribute');
                let listeners = [];

                return new Promise(function (resolve) {
                    objectAttributeCallback.and.callFake(resolve);

                    listeners.push(objectAPI.observe(mutableSecondInstance, 'objectAttribute.embeddedObject.embeddedKey', embeddedKeyCallback));
                    listeners.push(objectAPI.observe(mutableSecondInstance, 'objectAttribute.embeddedObject', embeddedObjectCallback));
                    listeners.push(objectAPI.observe(mutableSecondInstance, 'objectAttribute', objectAttributeCallback));

                    objectAPI.mutate(mutable, 'objectAttribute.embeddedObject.embeddedKey', 'updated-embedded-value');
                }).then(function () {
                    expect(embeddedKeyCallback).toHaveBeenCalledWith('updated-embedded-value');
                    expect(embeddedObjectCallback).toHaveBeenCalledWith({
                        embeddedKey: 'updated-embedded-value'
                    });
                    expect(objectAttributeCallback).toHaveBeenCalledWith({
                        embeddedObject: {
                            embeddedKey: 'updated-embedded-value'
                        }
                    });

                    listeners.forEach(listener => listener());
                });
            });
        });
    });
});

function hasOwnProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
}
