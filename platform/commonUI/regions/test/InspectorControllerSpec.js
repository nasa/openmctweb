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
    ['../src/InspectorController'],
    function (InspectorController) {

        describe("The inspector controller ", function () {
            var mockScope,
                mockDomainObject,
                mockOpenMCT,
                mockSelection,
                mockInspectorViews,
                mockTypeDef,
                controller,
                container,
                $document = [],
                selectable = [];

            beforeEach(function () {
                mockTypeDef = {
                    typeDef: {
                        inspector: "some-key"
                    }
                };

                mockDomainObject = jasmine.createSpyObj('domainObject', [
                    'getCapability'
                ]);
                mockDomainObject.getCapability.and.returnValue(mockTypeDef);

                mockScope = jasmine.createSpyObj('$scope',
                    ['$on', 'selection']
                );

                selectable[0] = {
                    context: {
                        oldItem: mockDomainObject
                    }
                };

                mockSelection = jasmine.createSpyObj("selection", [
                    'on',
                    'off',
                    'get'
                ]);
                mockSelection.get.and.returnValue(selectable);

                mockInspectorViews = jasmine.createSpyObj('inspectorViews', ['get']);
                mockOpenMCT = {
                    selection: mockSelection,
                    inspectorViews: mockInspectorViews
                };

                container = jasmine.createSpy('container', ['innerHTML']);
                $document[0] = jasmine.createSpyObj("$document", ['querySelectorAll']);
                $document[0].querySelectorAll.and.returnValue([container]);

                controller = new InspectorController(mockScope, mockOpenMCT, $document);
            });

            it("listens for selection change event", function () {
                expect(mockOpenMCT.selection.on).toHaveBeenCalledWith(
                    'change',
                    jasmine.any(Function)
                );

                expect(controller.selectedItem()).toEqual(mockDomainObject);

                var mockItem = jasmine.createSpyObj('domainObject', [
                    'getCapability'
                ]);
                mockItem.getCapability.and.returnValue(mockTypeDef);
                selectable[0].context.oldItem = mockItem;

                mockOpenMCT.selection.on.calls.mostRecent().args[1](selectable);

                expect(controller.selectedItem()).toEqual(mockItem);
            });

            it("cleans up on scope destroy", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    '$destroy',
                    jasmine.any(Function)
                );

                mockScope.$on.calls.all()[0].args[1]();

                expect(mockOpenMCT.selection.off).toHaveBeenCalledWith(
                    'change',
                    jasmine.any(Function)
                );
            });

            it("adds selection object to scope", function () {
                expect(mockScope.selection).toEqual(selectable);
                expect(controller.selectedItem()).toEqual(mockDomainObject);
            });
        });
    }
);
