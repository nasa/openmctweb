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
    ['../../src/capabilities/MetadataCapability'],
    function (MetadataCapability) {

        describe("The metadata capability", function () {
            var mockDomainObject,
                mockType,
                mockProperties,
                testModel,
                metadata;

            function getCapability(key) {
                return key === 'type' ? mockType : undefined;
            }

            function findValue(properties, name) {
                var i;
                for (i = 0; i < properties.length; i += 1) {
                    if (properties[i].name === name) {
                        return properties[i].value;
                    }
                }
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability', 'useCapability', 'getModel']
                );
                mockType = jasmine.createSpyObj(
                    'type',
                    ['getProperties', 'getName']
                );
                mockProperties = ['a', 'b', 'c'].map(function (k) {
                    var mockProperty = jasmine.createSpyObj(
                        'property-' + k,
                        ['getValue', 'getDefinition']
                    );
                    mockProperty.getValue.and.returnValue("Value " + k);
                    mockProperty.getDefinition.and.returnValue({ name: "Property " + k});

                    return mockProperty;
                });
                testModel = { name: "" };

                mockDomainObject.getId.and.returnValue("Test id");
                mockDomainObject.getModel.and.returnValue(testModel);
                mockDomainObject.getCapability.and.callFake(getCapability);
                mockDomainObject.useCapability.and.callFake(getCapability);
                mockType.getProperties.and.returnValue(mockProperties);
                mockType.getName.and.returnValue("Test type");

                metadata = new MetadataCapability(mockDomainObject);
            });

            it("reads properties from the domain object model", function () {
                metadata.invoke();
                mockProperties.forEach(function (mockProperty) {
                    expect(mockProperty.getValue).toHaveBeenCalledWith(testModel);
                });
            });

            it("reports type-specific properties", function () {
                var properties = metadata.invoke();
                expect(findValue(properties, 'Property a')).toEqual("Value a");
                expect(findValue(properties, 'Property b')).toEqual("Value b");
                expect(findValue(properties, 'Property c')).toEqual("Value c");
            });

            it("reports generic properties", function () {
                var properties = metadata.invoke();
                expect(findValue(properties, 'Type')).toEqual("Test type");
            });

        });
    }
);
