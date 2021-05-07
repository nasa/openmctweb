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
        '../../src/services/LinkService',
        '../DomainObjectFactory',
        '../ControlledPromise'
    ],
    function (LinkService, domainObjectFactory, ControlledPromise) {

        xdescribe("LinkService", function () {

            var linkService,
                mockPolicyService;

            beforeEach(function () {
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                mockPolicyService.allow.and.returnValue(true);
                linkService = new LinkService(mockPolicyService);
            });

            describe("validate", function () {

                var object,
                    parentCandidate,
                    validate;

                beforeEach(function () {
                    object = domainObjectFactory({
                        name: 'object'
                    });
                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate',
                        capabilities: {
                            composition: jasmine.createSpyObj(
                                'composition',
                                ['invoke', 'add']
                            )
                        }
                    });
                    validate = function () {
                        return linkService.validate(object, parentCandidate);
                    };
                });

                it("does not allow invalid parentCandidate", function () {
                    parentCandidate = undefined;
                    expect(validate()).toBe(false);
                    parentCandidate = {};
                    expect(validate()).toBe(false);
                });

                it("does not allow parent to be object", function () {
                    parentCandidate.id = object.id = 'abc';
                    expect(validate()).toBe(false);
                });

                it("does not allow parent that contains object", function () {
                    object.id = 'abc';
                    parentCandidate.id = 'xyz';
                    parentCandidate.model.composition = ['abc'];
                    expect(validate()).toBe(false);
                });

                it("does not allow parents without composition", function () {
                    parentCandidate = domainObjectFactory({
                        name: 'parentCandidate'
                    });
                    object.id = 'abc';
                    parentCandidate.id = 'xyz';
                    parentCandidate.hasCapability.and.callFake(function (c) {
                        return c !== 'composition';
                    });
                    expect(validate()).toBe(false);
                });

                describe("defers to policyService", function () {
                    beforeEach(function () {
                        object.id = 'abc';
                        object.capabilities.type = { type: 'object' };
                        parentCandidate.id = 'xyz';
                        parentCandidate.capabilities.type = {
                            type: 'parentCandidate'
                        };
                        parentCandidate.model.composition = [];
                    });

                    it("calls policy service with correct args", function () {
                        validate();
                        expect(mockPolicyService.allow).toHaveBeenCalledWith(
                            "composition",
                            parentCandidate,
                            object
                        );
                    });

                    it("and returns false", function () {
                        mockPolicyService.allow.and.returnValue(true);
                        expect(validate()).toBe(true);
                        expect(mockPolicyService.allow).toHaveBeenCalled();
                    });

                    it("and returns true", function () {
                        mockPolicyService.allow.and.returnValue(false);
                        expect(validate()).toBe(false);
                        expect(mockPolicyService.allow).toHaveBeenCalled();
                    });
                });
            });

            describe("perform", function () {

                var object,
                    linkedObject,
                    parentModel,
                    parentObject,
                    compositionPromise,
                    addPromise,
                    compositionCapability;

                beforeEach(function () {
                    compositionPromise = new ControlledPromise();
                    addPromise = new ControlledPromise();
                    compositionCapability = jasmine.createSpyObj(
                        'compositionCapability',
                        ['invoke', 'add']
                    );
                    compositionCapability.invoke.and.returnValue(compositionPromise);
                    compositionCapability.add.and.returnValue(addPromise);
                    parentModel = {
                        composition: []
                    };
                    parentObject = domainObjectFactory({
                        name: 'parentObject',
                        model: parentModel,
                        capabilities: {
                            mutation: {
                                invoke: function (mutator) {
                                    mutator(parentModel);

                                    return new ControlledPromise();
                                }
                            },
                            composition: compositionCapability
                        }
                    });

                    object = domainObjectFactory({
                        name: 'object',
                        id: 'xyz'
                    });

                    linkedObject = domainObjectFactory({
                        name: 'object-link',
                        id: 'xyz'
                    });

                });

                it("adds to the parent's composition", function () {
                    expect(compositionCapability.add).not.toHaveBeenCalled();
                    linkService.perform(object, parentObject);
                    expect(compositionCapability.add)
                        .toHaveBeenCalledWith(object);
                });

                it("returns object representing new link", function () {
                    var returnPromise, whenComplete;
                    returnPromise = linkService.perform(object, parentObject);
                    whenComplete = jasmine.createSpy('whenComplete');
                    returnPromise.then(whenComplete);

                    addPromise.resolve(linkedObject);
                    compositionPromise.resolve([linkedObject]);
                    expect(whenComplete).toHaveBeenCalledWith(linkedObject);
                });

                it("throws an error when performed on invalid inputs", function () {
                    function perform() {
                        linkService.perform(object, parentObject);
                    }

                    spyOn(linkService, 'validate');
                    linkService.validate.and.returnValue(true);
                    expect(perform).not.toThrow();
                    linkService.validate.and.returnValue(false);
                    expect(perform).toThrow();
                });
            });
        });
    }
);
