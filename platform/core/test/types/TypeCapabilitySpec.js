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
 * TypeCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/types/TypeCapability"],
    function (TypeCapability) {

        describe("The type capability", function () {
            var mockTypeService,
                mockDomainObject,
                mockType,
                type;

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    ["getType"]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getModel", "getCapability"]
                );
                mockType = {
                    someKey: "some value",
                    someOtherProperty: "some other property",
                    aThirdProperty: "a third property"
                };

                mockTypeService.getType.and.returnValue(mockType);
                mockDomainObject.getModel.and.returnValue({type: "mockType"});

                type = new TypeCapability(mockTypeService, mockDomainObject);
            });

            it("looks up an object's type from type service", function () {
                expect(type.someKey).toEqual(mockType.someKey);
                expect(type.someOtherProperty).toEqual(mockType.someOtherProperty);
                expect(type.aThirdProperty).toEqual(mockType.aThirdProperty);
                expect(mockTypeService.getType).toHaveBeenCalledWith("mockType");
            });

        });
    }
);
