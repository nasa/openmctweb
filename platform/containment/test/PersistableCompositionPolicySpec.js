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
    ["../src/PersistableCompositionPolicy"],
    function (PersistableCompositionPolicy) {
        describe("Persistable Composition policy", function () {
            var objectAPI;
            var mockOpenMCT;
            var persistableCompositionPolicy;
            var mockParent;
            var mockChild;
            var mockEditorCapability;

            beforeEach(function () {
                objectAPI = jasmine.createSpyObj('objectsAPI', [
                    'isPersistable',
                    'parseKeyString'
                ]);

                mockOpenMCT = {
                    objects: objectAPI
                };
                mockParent = jasmine.createSpyObj('domainObject', [
                    'hasCapability',
                    'getCapability',
                    'getId'
                ]);
                mockParent.hasCapability.and.returnValue(true);
                mockParent.getId.and.returnValue('someNamespace:someId');
                mockChild = {};
                mockEditorCapability = jasmine.createSpyObj('domainObject', [
                    'isEditContextRoot'
                ]);
                mockParent.getCapability.and.returnValue(mockEditorCapability);
                persistableCompositionPolicy = new PersistableCompositionPolicy(mockOpenMCT);
            });

            //Parent
            // - getCapability ('editor')
            //     - isEditContextRoot
            // - openMct.objects.getProvider

            it("Does not allow composition for objects that are not persistable", function () {
                mockEditorCapability.isEditContextRoot.and.returnValue(false);
                objectAPI.isPersistable.and.returnValue(true);
                expect(persistableCompositionPolicy.allow(mockParent, mockChild)).toBe(true);
                objectAPI.isPersistable.and.returnValue(false);
                expect(persistableCompositionPolicy.allow(mockParent, mockChild)).toBe(false);
            });

            it("Always allows composition of objects in edit mode to support object creation", function () {
                mockEditorCapability.isEditContextRoot.and.returnValue(true);
                objectAPI.isPersistable.and.returnValue(true);
                expect(persistableCompositionPolicy.allow(mockParent, mockChild)).toBe(true);
                expect(objectAPI.isPersistable).not.toHaveBeenCalled();

                mockEditorCapability.isEditContextRoot.and.returnValue(false);
                objectAPI.isPersistable.and.returnValue(true);
                expect(persistableCompositionPolicy.allow(mockParent, mockChild)).toBe(true);
                expect(objectAPI.isPersistable).toHaveBeenCalled();
            });

        });
    }
);
