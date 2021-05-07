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

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/CreateWizard"],
    function (CreateWizard) {

        xdescribe("The create wizard", function () {
            var mockType,
                mockParent,
                mockProperties,
                mockPolicyService,
                testModel,
                mockDomainObject,
                wizard;

            function createMockProperty(name) {
                var mockProperty = jasmine.createSpyObj(
                    "property" + name,
                    ["getDefinition", "getValue", "setValue"]
                );
                mockProperty.getDefinition.and.returnValue({
                    control: "textfield"
                });
                mockProperty.getValue.and.returnValue(name);

                return mockProperty;
            }

            beforeEach(function () {
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getGlyph",
                        "getCssClass",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel"
                    ]
                );
                mockParent = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel",
                        "getCapability"
                    ]
                );
                mockProperties = ["A", "B", "C"].map(createMockProperty);
                mockPolicyService = jasmine.createSpyObj('policyService', ['allow']);

                testModel = { someKey: "some value" };

                mockType.getKey.and.returnValue("test");
                mockType.getCssClass.and.returnValue("icon-telemetry");
                mockType.getDescription.and.returnValue("a test type");
                mockType.getName.and.returnValue("Test");
                mockType.getInitialModel.and.returnValue(testModel);
                mockType.getProperties.and.returnValue(mockProperties);

                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'useCapability', 'getModel']
                );

                //Mocking the getCapability('type') call
                mockDomainObject.getCapability.and.returnValue(mockType);
                mockDomainObject.useCapability.and.returnValue();
                mockDomainObject.getModel.and.returnValue(testModel);

                wizard = new CreateWizard(
                    mockDomainObject,
                    mockParent,
                    mockPolicyService
                );
            });

            it("creates a form model with a Properties section", function () {
                expect(wizard.getFormStructure().sections[0].name)
                    .toEqual("Properties");
            });

            it("adds one row per defined type property", function () {
                // Three properties were defined in the mock type
                expect(wizard.getFormStructure().sections[0].rows.length)
                    .toEqual(3);
            });

            it("interprets form data using type-defined properties", function () {
                // Use key names from mock properties
                wizard.createModel([
                    "field 0",
                    "field 1",
                    "field 2"
                ]);

                // Should have gotten a setValue call
                mockProperties.forEach(function (mockProperty, i) {
                    expect(mockProperty.setValue).toHaveBeenCalledWith(
                        {
                            someKey: "some value",
                            type: 'test'
                        },
                        "field " + i
                    );
                });
            });

            it("looks up initial values from properties", function () {
                var initialValue = wizard.getInitialFormValue();

                expect(initialValue[0]).toEqual("A");
                expect(initialValue[1]).toEqual("B");
                expect(initialValue[2]).toEqual("C");

                // Verify that expected argument was passed
                mockProperties.forEach(function (mockProperty) {
                    expect(mockProperty.getValue)
                        .toHaveBeenCalledWith(testModel);
                });
            });

            it("populates the model on the associated object", function () {
                var formValue = {
                        "A": "ValueA",
                        "B": "ValueB",
                        "C": "ValueC"
                    },
                    compareModel = wizard.createModel(formValue);
                //populateObjectFromInput adds a .location attribute that is not added by createModel.
                compareModel.location = undefined;
                wizard.populateObjectFromInput(formValue);
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith('mutation', jasmine.any(Function));
                expect(mockDomainObject.useCapability.calls.mostRecent().args[1]()).toEqual(compareModel);
            });

            it("validates selection types using policy", function () {
                var mockDomainObj = jasmine.createSpyObj(
                        'domainObject',
                        ['getCapability']
                    ),
                    mockOtherType = jasmine.createSpyObj(
                        'otherType',
                        ['getKey']
                    ),

                    //Create a form structure with location
                    structure = wizard.getFormStructure(true),
                    sections = structure.sections,
                    rows = structure.sections[sections.length - 1].rows,
                    locationRow = rows[rows.length - 1];

                mockDomainObj.getCapability.and.returnValue(mockOtherType);
                locationRow.validate(mockDomainObj);

                // Should check policy to see if the user-selected location
                // can actually contain objects of this type
                expect(mockPolicyService.allow).toHaveBeenCalledWith(
                    'composition',
                    mockDomainObj,
                    mockDomainObject
                );
            });

            it("creates a form model without a location if not requested", function () {
                expect(wizard.getFormStructure(false).sections.some(function (section) {
                    return section.name === 'Location';
                })).toEqual(false);
            });

        });
    }
);
