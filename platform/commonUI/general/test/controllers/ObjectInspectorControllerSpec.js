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
 * Created by shale on 08/24/2015.
 */
define(
    ["../../src/controllers/ObjectInspectorController"],
    function (ObjectInspectorController) {

        describe("The object inspector controller ", function () {
            var mockScope,
                mockObjectService,
                mockPromise,
                mockDomainObject,
                mockContextCapability,
                mockLocationCapability,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$watch", "$on"]
                );

                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    ["getObjects"]
                );
                mockPromise = jasmine.createSpyObj(
                    "promise",
                    ["then"]
                );
                mockObjectService.getObjects.and.returnValue(mockPromise);

                mockDomainObject = jasmine.createSpyObj(
                    "selectedObject",
                    ["hasCapability", "getCapability", "useCapability", "getModel"]
                );
                mockDomainObject.getModel.and.returnValue({location: 'somewhere'});
                mockDomainObject.hasCapability.and.returnValue(true);

                mockContextCapability = jasmine.createSpyObj(
                    "context capability",
                    ["getParent"]
                );
                mockLocationCapability = jasmine.createSpyObj(
                    "location capability",
                    ["isLink"]
                );

                mockDomainObject.getCapability.and.callFake(function (param) {
                    if (param === 'location') {
                        return mockLocationCapability;
                    } else if (param === 'context') {
                        return mockContextCapability;
                    } else if (param === 'mutation') {
                        return {
                            listen: function () {
                                return true;
                            }
                        };
                    }
                });

                mockScope.domainObject = mockDomainObject;
                controller = new ObjectInspectorController(mockScope, mockObjectService);
            });

            it("watches for changes to the selected object", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith('domainObject', jasmine.any(Function));
            });

            it("looks for contextual parent objects", function () {
                mockScope.$watch.calls.mostRecent().args[1]();
                expect(mockContextCapability.getParent).toHaveBeenCalled();
            });

            it("if link, looks for primary parent objects", function () {
                mockLocationCapability.isLink.and.returnValue(true);

                mockScope.$watch.calls.mostRecent().args[1]();
                expect(mockDomainObject.getModel).toHaveBeenCalled();
                expect(mockObjectService.getObjects).toHaveBeenCalled();
                mockPromise.then.calls.mostRecent().args[0]({'somewhere': mockDomainObject});
            });

            it("gets metadata", function () {
                mockScope.$watch.calls.mostRecent().args[1]();
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith('metadata');
            });
        });
    }
);
