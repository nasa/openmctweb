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

define([
    '../../src/policies/CopyPolicy',
    '../DomainObjectFactory'
], function (CopyPolicy, domainObjectFactory) {

    describe("CopyPolicy", function () {
        var testMetadata,
            testContext,
            mockDomainObject,
            mockType,
            mockAction,
            policy;

        beforeEach(function () {
            mockType =
                jasmine.createSpyObj('type', ['hasFeature']);

            testMetadata = {};

            mockDomainObject = domainObjectFactory({
                capabilities: { type: mockType }
            });

            mockType.hasFeature.and.callFake(function (feature) {
                return feature === 'creation';
            });

            mockAction = jasmine.createSpyObj('action', ['getMetadata']);
            mockAction.getMetadata.and.returnValue(testMetadata);

            testContext = { domainObject: mockDomainObject };

            policy = new CopyPolicy();
        });

        describe("for copy actions", function () {
            beforeEach(function () {
                testMetadata.key = 'copy';
            });

            describe("when an object is non-creatable", function () {
                beforeEach(function () {
                    mockType.hasFeature.and.returnValue(false);
                });

                it("disallows the action", function () {
                    expect(policy.allow(mockAction, testContext)).toBe(false);
                });
            });

            describe("when an object is creatable", function () {
                it("allows the action", function () {
                    expect(policy.allow(mockAction, testContext)).toBe(true);
                });
            });
        });

        describe("for other actions", function () {
            beforeEach(function () {
                testMetadata.key = 'foo';
            });

            it("simply allows the action", function () {
                expect(policy.allow(mockAction, testContext)).toBe(true);
                mockType.hasFeature.and.returnValue(false);
                expect(policy.allow(mockAction, testContext)).toBe(true);
            });
        });
    });
});
