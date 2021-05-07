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
        '../../src/actions/LinkAction',
        '../services/MockLinkService',
        '../DomainObjectFactory'
    ],
    function (LinkAction, MockLinkService, domainObjectFactory) {

        describe("Link Action", function () {

            var linkAction,
                policyService,
                locationService,
                locationServicePromise,
                linkService,
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
                policyService.allow.and.returnValue(true);

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

                locationService
                    .getLocationFromUser
                    .and.returnValue(locationServicePromise);

                linkService = new MockLinkService();
            });

            describe("with context from context-action", function () {
                beforeEach(function () {
                    context = {
                        domainObject: selectedObject
                    };

                    linkAction = new LinkAction(
                        policyService,
                        locationService,
                        linkService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(linkAction).toBeDefined();
                });

                describe("when performed it", function () {
                    beforeEach(function () {
                        linkAction.perform();
                    });

                    it("prompts for location", function () {
                        expect(locationService.getLocationFromUser)
                            .toHaveBeenCalledWith(
                                "Link selectedObject To a New Location",
                                "Link To",
                                jasmine.any(Function),
                                currentParent
                            );
                    });

                    it("waits for location and handles cancellation by user", function () {
                        expect(locationServicePromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
                    });

                    it("links object to selected location", function () {
                        locationServicePromise
                            .then
                            .calls.mostRecent()
                            .args[0](newParent);

                        expect(linkService.perform)
                            .toHaveBeenCalledWith(selectedObject, newParent);
                    });
                });
            });

            describe("with context from drag-drop", function () {
                beforeEach(function () {
                    context = {
                        selectedObject: selectedObject,
                        domainObject: newParent
                    };

                    linkAction = new LinkAction(
                        policyService,
                        locationService,
                        linkService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(linkAction).toBeDefined();
                });

                it("performs link immediately", function () {
                    linkAction.perform();
                    expect(linkService.perform)
                        .toHaveBeenCalledWith(selectedObject, newParent);
                });
            });
        });
    }
);
