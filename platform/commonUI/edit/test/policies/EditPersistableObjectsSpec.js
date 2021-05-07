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
    ["../../src/policies/EditPersistableObjectsPolicy"],
    function (EditPersistableObjectsPolicy) {

        describe("The Edit persistable objects policy", function () {
            var mockDomainObject,
                mockEditAction,
                mockPropertiesAction,
                mockOtherAction,
                mockAPI,
                mockObjectAPI,
                testContext,
                policy;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [
                        'getId'
                    ]
                );

                mockObjectAPI = jasmine.createSpyObj('objectAPI', [
                    'isPersistable',
                    'parseKeyString'
                ]);

                mockAPI = {
                    objects: mockObjectAPI
                };

                mockEditAction = jasmine.createSpyObj('edit', ['getMetadata']);
                mockPropertiesAction = jasmine.createSpyObj('properties', ['getMetadata']);
                mockOtherAction = jasmine.createSpyObj('other', ['getMetadata']);

                mockEditAction.getMetadata.and.returnValue({ key: 'edit' });
                mockPropertiesAction.getMetadata.and.returnValue({ key: 'properties' });
                mockOtherAction.getMetadata.and.returnValue({key: 'other'});

                mockDomainObject.getId.and.returnValue('test:testId');

                testContext = {
                    domainObject: mockDomainObject,
                    category: 'view-control'
                };

                policy = new EditPersistableObjectsPolicy(mockAPI);
            });

            it("Applies to edit action", function () {
                expect(mockObjectAPI.isPersistable).not.toHaveBeenCalled();

                policy.allow(mockEditAction, testContext);
                expect(mockObjectAPI.isPersistable).toHaveBeenCalled();
            });

            it("Applies to properties action", function () {
                expect(mockObjectAPI.isPersistable).not.toHaveBeenCalled();

                policy.allow(mockPropertiesAction, testContext);
                expect(mockObjectAPI.isPersistable).toHaveBeenCalled();
            });

            it("does not apply to other actions", function () {
                expect(mockObjectAPI.isPersistable).not.toHaveBeenCalled();

                policy.allow(mockOtherAction, testContext);
                expect(mockObjectAPI.isPersistable).not.toHaveBeenCalled();
            });

            it("Tests object provider for editability", function () {
                mockObjectAPI.isPersistable.and.returnValue(false);
                expect(policy.allow(mockEditAction, testContext)).toBe(false);
                expect(mockObjectAPI.isPersistable).toHaveBeenCalled();
                mockObjectAPI.isPersistable.and.returnValue(true);
                expect(policy.allow(mockEditAction, testContext)).toBe(true);
            });
        });
    }
);
