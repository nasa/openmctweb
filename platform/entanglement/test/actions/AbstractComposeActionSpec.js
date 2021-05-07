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
        '../../src/actions/AbstractComposeAction',
        '../services/MockCopyService',
        '../DomainObjectFactory'
    ],
    function (AbstractComposeAction, MockCopyService, domainObjectFactory) {

        describe("Move/copy/link Actions", function () {

            var action,
                policyService,
                locationService,
                locationServicePromise,
                composeService,
                context,
                selectedObject,
                selectedObjectContextCapability,
                currentParent,
                newParent;

            beforeEach(function () {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );

                selectedObjectContextCapability = jasmine.createSpyObj(
                    'selectedObjectContextCapability',
                    [
                        'getParent'
                    ]
                );

                selectedObject = domainObjectFactory({
                    name: 'selectedObject',
                    model: {
                        name: 'selectedObject'
                    },
                    capabilities: {
                        context: selectedObjectContextCapability
                    }
                });

                currentParent = domainObjectFactory({
                    name: 'currentParent'
                });

                selectedObjectContextCapability
                    .getParent
                    .and.returnValue(currentParent);

                newParent = domainObjectFactory({
                    name: 'newParent'
                });

                locationService = jasmine.createSpyObj(
                    'locationService',
                    [
                        'getLocationFromUser'
                    ]
                );

                locationServicePromise = jasmine.createSpyObj(
                    'locationServicePromise',
                    [
                        'then'
                    ]
                );

                policyService.allow.and.returnValue(true);

                locationService
                    .getLocationFromUser
                    .and.returnValue(locationServicePromise);

                composeService = new MockCopyService();
            });

            it("are only applicable to domain objects with a context", function () {
                var noContextObject = domainObjectFactory({
                    name: 'selectedObject',
                    model: { name: 'selectedObject' },
                    capabilities: {}
                });

                expect(AbstractComposeAction.appliesTo({
                    selectedObject: selectedObject
                })).toBe(true);
                expect(AbstractComposeAction.appliesTo({
                    domainObject: selectedObject
                })).toBe(true);

                expect(AbstractComposeAction.appliesTo({
                    selectedObject: noContextObject
                })).toBe(false);
                expect(AbstractComposeAction.appliesTo({
                    domainObject: noContextObject
                })).toBe(false);
            });

            describe("with context from context-action", function () {
                beforeEach(function () {
                    context = {
                        domainObject: selectedObject
                    };

                    action = new AbstractComposeAction(
                        policyService,
                        locationService,
                        composeService,
                        context,
                        "Compose"
                    );
                });

                it("initializes happily", function () {
                    expect(action).toBeDefined();
                });

                describe("when performed it", function () {
                    beforeEach(function () {
                        action.perform();
                    });

                    it("prompts for location", function () {
                        expect(locationService.getLocationFromUser)
                            .toHaveBeenCalledWith(
                                "Compose selectedObject To a New Location",
                                "Compose To",
                                jasmine.any(Function),
                                currentParent
                            );
                    });

                    it("waits for location and handles cancellation by user", function () {
                        expect(locationServicePromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
                    });

                    it("copies object to selected location", function () {
                        locationServicePromise
                            .then
                            .calls.mostRecent()
                            .args[0](newParent);

                        expect(composeService.perform)
                            .toHaveBeenCalledWith(selectedObject, newParent);
                    });

                    describe("provides a validator which", function () {
                        var validator;

                        beforeEach(function () {
                            validator = locationService.getLocationFromUser
                                .calls.mostRecent().args[2];
                            composeService.validate.and.returnValue(true);
                            policyService.allow.and.returnValue(true);
                        });

                        it("is sensitive to policy", function () {
                            expect(validator()).toBe(true);
                            policyService.allow.and.returnValue(false);
                            expect(validator()).toBe(false);
                        });

                        it("is sensitive to service-specific validation", function () {
                            expect(validator()).toBe(true);
                            composeService.validate.and.returnValue(false);
                            expect(validator()).toBe(false);
                        });

                    });
                });
            });

            describe("with context from drag-drop", function () {
                beforeEach(function () {
                    context = {
                        selectedObject: selectedObject,
                        domainObject: newParent
                    };

                    action = new AbstractComposeAction(
                        policyService,
                        locationService,
                        composeService,
                        context,
                        "Compose"
                    );
                });

                it("initializes happily", function () {
                    expect(action).toBeDefined();
                });

                it("performs copy immediately", function () {
                    action.perform();
                    expect(composeService.perform)
                        .toHaveBeenCalledWith(selectedObject, newParent);
                });
            });
        });
    }
);
