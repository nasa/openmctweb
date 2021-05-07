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
        '../../src/policies/CrossSpacePolicy',
        '../DomainObjectFactory'
    ],
    function (CrossSpacePolicy, domainObjectFactory) {

        describe("CrossSpacePolicy", function () {
            var mockAction,
                testActionMetadata,
                sameSpaceContext,
                crossSpaceContext,
                policy;

            function makeObject(space) {
                var mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['getSpace']
                );
                mockPersistence.getSpace.and.returnValue(space);

                return domainObjectFactory({
                    id: space + ":foo",
                    model: {},
                    capabilities: { persistence: mockPersistence }
                });
            }

            beforeEach(function () {
                testActionMetadata = {};

                // Policy should only call passive methods, so
                // only define those in mocks.
                mockAction = jasmine.createSpyObj(
                    'action',
                    ['getMetadata']
                );
                mockAction.getMetadata.and.returnValue(testActionMetadata);

                sameSpaceContext = {
                    domainObject: makeObject('a'),
                    selectedObject: makeObject('a')
                };
                crossSpaceContext = {
                    domainObject: makeObject('a'),
                    selectedObject: makeObject('b')
                };

                policy = new CrossSpacePolicy();
            });

            describe("for move actions", function () {
                beforeEach(function () {
                    testActionMetadata.key = 'move';
                });

                it("allows same-space changes", function () {
                    expect(policy.allow(mockAction, sameSpaceContext))
                        .toBe(true);
                });

                it("disallows cross-space changes", function () {
                    expect(policy.allow(mockAction, crossSpaceContext))
                        .toBe(false);
                });

                it("allows actions with no selectedObject", function () {
                    expect(policy.allow(mockAction, {
                        domainObject: makeObject('a')
                    })).toBe(true);
                });
            });

            describe("for other actions", function () {
                beforeEach(function () {
                    testActionMetadata.key = "some-other-action";
                });

                it("allows same-space and cross-space changes", function () {
                    expect(policy.allow(mockAction, crossSpaceContext))
                        .toBe(true);
                    expect(policy.allow(mockAction, sameSpaceContext))
                        .toBe(true);
                });

                it("allows actions with no selectedObject", function () {
                    expect(policy.allow(mockAction, {
                        domainObject: makeObject('a')
                    })).toBe(true);
                });
            });

        });
    }
);
