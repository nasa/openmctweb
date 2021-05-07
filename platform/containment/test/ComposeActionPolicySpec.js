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
    ["../src/ComposeActionPolicy"],
    function (ComposeActionPolicy) {
        xdescribe("The compose action policy", function () {
            var mockInjector,
                mockPolicyService,
                mockTypes,
                mockDomainObjects,
                mockAction,
                testContext,
                policy;

            beforeEach(function () {
                mockInjector = jasmine.createSpyObj('$injector', ['get']);
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    ['allow']
                );
                mockTypes = ['a', 'b'].map(function (type) {
                    var mockType = jasmine.createSpyObj('type-' + type, ['getKey']);
                    mockType.getKey.and.returnValue(type);

                    return mockType;
                });
                mockDomainObjects = ['a', 'b'].map(function (id, index) {
                    var mockDomainObject = jasmine.createSpyObj(
                        'domainObject-' + id,
                        ['getId', 'getCapability']
                    );
                    mockDomainObject.getId.and.returnValue(id);
                    mockDomainObject.getCapability.and.callFake(function (c) {
                        return c === 'type' && mockTypes[index];
                    });

                    return mockDomainObject;
                });
                mockAction = jasmine.createSpyObj('action', ['getMetadata']);

                testContext = {
                    key: 'compose',
                    domainObject: mockDomainObjects[0],
                    selectedObject: mockDomainObjects[1]
                };

                mockAction.getMetadata.and.returnValue(testContext);
                mockInjector.get.and.callFake(function (service) {
                    return service === 'policyService' && mockPolicyService;
                });

                policy = new ComposeActionPolicy(mockInjector);
            });

            it("defers to composition policy", function () {
                mockPolicyService.allow.and.returnValue(false);
                expect(policy.allow(mockAction, testContext)).toBeFalsy();
                mockPolicyService.allow.and.returnValue(true);
                expect(policy.allow(mockAction, testContext)).toBeTruthy();

                expect(mockPolicyService.allow).toHaveBeenCalledWith(
                    'composition',
                    mockDomainObjects[0],
                    mockDomainObjects[1]
                );
            });

            it("allows actions other than compose", function () {
                testContext.key = 'somethingElse';
                mockPolicyService.allow.and.returnValue(false);
                expect(policy.allow(mockAction, testContext)).toBeTruthy();
            });
        });
    }
);
