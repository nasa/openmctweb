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
    ['../src/EditableRegionPolicy'],
    function (EditableRegionPolicy) {

        describe("The editable region policy ", function () {

            var editableRegionPolicy,
                mockDomainObject,
                mockEditorCapability,
                mockBrowseRegionPart = {
                    modes: 'browse'
                },
                mockEditRegionPart = {
                    modes: 'edit'
                },
                mockAllModesRegionPart = {};

            beforeEach(function () {
                editableRegionPolicy = new EditableRegionPolicy();

                mockEditorCapability = jasmine.createSpyObj("editorCapability", [
                    "inEditContext"
                ]);
                mockDomainObject = jasmine.createSpyObj("domainObject", [
                    "hasCapability", "getCapability"
                ]);
                mockDomainObject.hasCapability.and.returnValue(true);
                mockDomainObject.getCapability.and.returnValue(mockEditorCapability);
            });

            it("includes only browse region parts for object not in edit mode", function () {
                mockEditorCapability.inEditContext.and.returnValue(false);
                expect(editableRegionPolicy.allow(mockBrowseRegionPart, mockDomainObject)).toBe(true);
                expect(editableRegionPolicy.allow(mockEditRegionPart, mockDomainObject)).toBe(false);
            });

            it("includes only edit region parts for object in edit mode", function () {
                mockEditorCapability.inEditContext.and.returnValue(true);
                expect(editableRegionPolicy.allow(mockBrowseRegionPart, mockDomainObject)).toBe(false);
                expect(editableRegionPolicy.allow(mockEditRegionPart, mockDomainObject)).toBe(true);
            });

            it("includes region parts with no mode specification", function () {
                mockEditorCapability.inEditContext.and.returnValue(false);
                expect(editableRegionPolicy.allow(mockAllModesRegionPart, mockDomainObject)).toBe(true);
                mockEditorCapability.inEditContext.and.returnValue(true);
                expect(editableRegionPolicy.allow(mockAllModesRegionPart, mockDomainObject)).toBe(true);
            });

        });
    }
);
