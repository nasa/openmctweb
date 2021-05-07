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
    ["../../src/services/Instantiate"],
    function (Instantiate) {

        describe("The 'instantiate' service", function () {

            var mockCapabilityService,
                mockIdentifierService,
                mockCapabilityConstructor,
                mockCapabilityInstance,
                mockCacheService,
                idCounter,
                testModel,
                instantiate,
                domainObject;

            beforeEach(function () {
                idCounter = 0;

                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    ['getCapabilities']
                );
                mockIdentifierService = jasmine.createSpyObj(
                    'identifierService',
                    ['parse', 'generate']
                );
                mockCapabilityConstructor = jasmine.createSpy('capability');
                mockCapabilityInstance = {};
                mockCapabilityService.getCapabilities.and.returnValue({
                    something: mockCapabilityConstructor
                });
                mockCapabilityConstructor.and.returnValue(mockCapabilityInstance);

                mockIdentifierService.generate.and.callFake(function (space) {
                    return (space ? (space + ":") : "")
                            + "some-id-" + (idCounter += 1);
                });

                mockCacheService = jasmine.createSpyObj(
                    'cacheService',
                    ['get', 'put', 'remove', 'all']
                );

                testModel = { someKey: "some value" };

                instantiate = new Instantiate(
                    mockCapabilityService,
                    mockIdentifierService,
                    mockCacheService
                );
                domainObject = instantiate(testModel);
            });

            it("loads capabilities from the capability service", function () {
                expect(mockCapabilityService.getCapabilities)
                    .toHaveBeenCalledWith(testModel);
            });

            it("exposes loaded capabilities from the created object", function () {
                expect(domainObject.getCapability('something'))
                    .toBe(mockCapabilityInstance);
                expect(mockCapabilityConstructor)
                    .toHaveBeenCalledWith(domainObject);
            });

            it("exposes the provided model", function () {
                expect(domainObject.getModel()).toEqual(testModel);
            });

            it("provides unique identifiers", function () {
                expect(domainObject.getId()).toEqual(jasmine.any(String));
                expect(instantiate(testModel).getId())
                    .not.toEqual(domainObject.getId());
            });

            it("caches the instantiated model", function () {
                expect(mockCacheService.put).toHaveBeenCalledWith(
                    domainObject.getId(),
                    testModel
                );
            });
        });

    }
);
