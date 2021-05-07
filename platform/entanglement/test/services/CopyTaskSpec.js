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
        '../../src/services/CopyTask',
        '../DomainObjectFactory'
    ],
    function (CopyTask, domainObjectFactory) {

        var ID_A = "some-string-with-vaguely-uuidish-uniqueness",
            ID_B = "some-other-similarly-unique-string";

        function synchronousPromise(value) {
            return (value && value.then) ? value : {
                then: function (callback) {
                    return synchronousPromise(callback(value));
                }
            };
        }

        describe("CopyTask", function () {
            var mockDomainObject,
                mockParentObject,
                mockFilter,
                mockQ,
                mockDeferred,
                testModel,
                counter,
                cloneIds,
                task;

            function makeMockCapabilities(childIds) {
                var mockCapabilities = {
                        persistence: jasmine.createSpyObj(
                            'persistence',
                            ['persist']
                        ),
                        composition: jasmine.createSpyObj(
                            'composition',
                            ['add', 'invoke']
                        ),
                        instantiation: jasmine.createSpyObj(
                            'instantiation',
                            ['instantiate', 'invoke']
                        )
                    },
                    mockChildren = (childIds || []).map(function (id) {
                        return domainObjectFactory({
                            id: id,
                            capabilities: makeMockCapabilities([]),
                            model: { originalId: id }
                        });
                    });

                mockCapabilities.persistence.persist
                    .and.returnValue(synchronousPromise(true));
                mockCapabilities.composition.add.and.callFake(function (obj) {
                    return synchronousPromise(obj);
                });
                mockCapabilities.composition.invoke
                    .and.returnValue(synchronousPromise(mockChildren));
                mockCapabilities.instantiation.invoke
                    .and.callFake(function (model) {
                        var id = "some-id-" + counter;
                        cloneIds[model.originalId] = id;
                        counter += 1;

                        return domainObjectFactory({
                            id: id,
                            model: model,
                            capabilities: makeMockCapabilities()
                        });
                    });

                return mockCapabilities;
            }

            beforeEach(function () {
                counter = 0;
                cloneIds = {};

                testModel = {
                    composition: [ID_A, ID_B],
                    someObj: {},
                    someArr: [ID_A, ID_B],
                    objArr: [{"id": ID_A}, {"id": ID_B}],
                    singleElementArr: [ID_A]
                };
                testModel.someObj[ID_A] = "some value";
                testModel.someObj.someProperty = ID_B;

                mockDomainObject = domainObjectFactory({
                    capabilities: makeMockCapabilities(testModel.composition),
                    model: testModel
                });
                mockParentObject = domainObjectFactory({
                    capabilities: makeMockCapabilities()
                });
                mockFilter = jasmine.createSpy('filter');
                mockQ = jasmine.createSpyObj('$q', ['when', 'defer', 'all']);
                mockDeferred = jasmine.createSpyObj(
                    'deferred',
                    ['notify', 'resolve', 'reject']
                );

                mockFilter.and.returnValue(true);

                mockQ.when.and.callFake(synchronousPromise);
                mockQ.defer.and.returnValue(mockDeferred);
                mockQ.all.and.callFake(function (promises) {
                    return synchronousPromise(promises.map(function (promise) {
                        var value;
                        promise.then(function (v) {
                            value = v;
                        });

                        return value;
                    }));
                });

                mockDeferred.resolve.and.callFake(function (value) {
                    mockDeferred.promise = synchronousPromise(value);
                });

            });

            describe("produces models which", function () {
                var model;

                beforeEach(function () {
                    task = new CopyTask(
                        mockDomainObject,
                        mockParentObject,
                        mockFilter,
                        mockQ
                    );

                    task.perform().then(function (clone) {
                        model = clone.getModel();
                    });
                });

                it("contain rewritten identifiers in arrays", function () {
                    expect(model.someArr)
                        .toEqual(testModel.someArr.map(function (id) {
                            return cloneIds[id];
                        }));
                });

                it("contain rewritten identifiers in properties", function () {
                    expect(model.someObj.someProperty)
                        .toEqual(cloneIds[testModel.someObj.someProperty]);
                });

                it("contain rewritten identifiers in property names", function () {
                    expect(model.someObj[cloneIds[ID_A]])
                        .toEqual(testModel.someObj[ID_A]);
                });

                it("contain rewritten identifiers in single-element arrays", function () {
                    expect(model.singleElementArr)
                        .toEqual(testModel.singleElementArr.map(function (id) {
                            return cloneIds[id];
                        }));
                });
            });

            describe("copies object trees with multiple references to the"
                + " same object", function () {
                var mockDomainObjectB,
                    mockComposingObject,
                    composingObjectModel,
                    domainObjectClone,
                    domainObjectBClone;

                beforeEach(function () {
                    mockDomainObjectB = domainObjectFactory({
                        capabilities: makeMockCapabilities(testModel.composition),
                        model: testModel
                    });
                    composingObjectModel = {
                        name: 'mockComposingObject',
                        composition: [mockDomainObject.getId(), mockDomainObjectB.getId()]
                    };
                    mockComposingObject = domainObjectFactory({
                        capabilities: makeMockCapabilities(composingObjectModel.composition),
                        model: composingObjectModel
                    });

                    mockComposingObject.capabilities.composition.invoke.and.returnValue([mockDomainObject, mockDomainObjectB]);
                    task = new CopyTask(
                        mockComposingObject,
                        mockParentObject,
                        mockFilter,
                        mockQ
                    );

                    task.perform();
                    domainObjectClone = task.clones[2];
                    domainObjectBClone = task.clones[5];
                });

                /**
                 * mockDomainObject and mockDomainObjectB have the same
                 * model with references to children ID_A and ID_B. Expect
                 * that after duplication the references should differ
                 * because they are each now referencing different child
                 * objects. This tests the issue reported in #428
                 */
                it(" and correctly updates child identifiers in models ", function () {
                    var childA_ID = task.clones[0].getId(),
                        childB_ID = task.clones[1].getId(),
                        childC_ID = task.clones[3].getId(),
                        childD_ID = task.clones[4].getId();

                    expect(domainObjectClone.model.someArr[0]).not.toBe(domainObjectBClone.model.someArr[0]);
                    expect(domainObjectClone.model.someArr[0]).toBe(childA_ID);
                    expect(domainObjectBClone.model.someArr[0]).toBe(childC_ID);
                    expect(domainObjectClone.model.someArr[1]).not.toBe(domainObjectBClone.model.someArr[1]);
                    expect(domainObjectClone.model.someArr[1]).toBe(childB_ID);
                    expect(domainObjectBClone.model.someArr[1]).toBe(childD_ID);
                    expect(domainObjectClone.model.someObj.someProperty).not.toBe(domainObjectBClone.model.someObj.someProperty);
                    expect(domainObjectClone.model.someObj.someProperty).toBe(childB_ID);
                    expect(domainObjectBClone.model.someObj.someProperty).toBe(childD_ID);

                });

                /**
                 * This a bug found in testathon when testing issue #428
                 */
                it(" and correctly updates child identifiers in object"
                    + " arrays within models ", function () {
                    var childA_ID = task.clones[0].getId(),
                        childB_ID = task.clones[1].getId();

                    expect(domainObjectClone.model.objArr[0].id).not.toBe(ID_A);
                    expect(domainObjectClone.model.objArr[0].id).toBe(childA_ID);
                    expect(domainObjectClone.model.objArr[1].id).not.toBe(ID_B);
                    expect(domainObjectClone.model.objArr[1].id).toBe(childB_ID);

                });
            });

        });

    }
);
