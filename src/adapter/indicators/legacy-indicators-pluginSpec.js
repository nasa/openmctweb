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
        "../../MCT",
        "../../../platform/commonUI/general/src/directives/MCTIndicators",
        "./legacy-indicators-plugin"
    ],
    function (
        MCT,
        MCTIndicators,
        LegacyIndicatorsPlugin
    ) {
        let openmct;
        let directive;
        let holderElement;
        const legacyExtensionFunction = MCT.prototype.legacyExtension;
        let legacyIndicatorsRunsFunction;

        xdescribe('The legacy indicators plugin', function () {
            beforeEach(function () {
                mockLegacyExtensionFunction();

                openmct = new MCT();
                directive = new MCTIndicators(openmct);
                holderElement = document.createElement('div');

                mockAngularComponents();
                LegacyIndicatorsPlugin()(openmct);
            });

            afterEach(function () {
                MCT.prototype.legacyExtension = legacyExtensionFunction;
            });

            function mockLegacyExtensionFunction() {
                spyOn(MCT.prototype, "legacyExtension");
                MCT.prototype.legacyExtension.and.callFake(function (extensionName, definition) {
                    if (extensionName === 'runs') {
                        legacyIndicatorsRunsFunction = definition.implementation;
                    }
                });
            }

            function mockAngularComponents() {
                const mockInjector = jasmine.createSpyObj('$injector', ['get']);
                const mockCompile = jasmine.createSpy('$compile');
                const mockRootScope = jasmine.createSpyObj('rootScope', ['$new']);
                const mockScope = {};

                mockRootScope.$new.and.returnValue(mockScope);
                mockInjector.get.and.callFake(function (service) {
                    return {
                        '$compile': mockCompile,
                        '$rootScope': mockRootScope
                    }[service];
                });

                openmct.$injector = mockInjector;
                mockCompile.and.callFake(function () {
                    return function () {
                        return [document.createElement('div')];
                    };
                });
            }

            it("Displays any legacy indicators ", function () {
                const legacyIndicators = [{}, {}, {}, {}];

                legacyIndicatorsRunsFunction(legacyIndicators);
                renderIndicators();

                expect(holderElement.children.length).toBe(legacyIndicators.length);

            });

            it("If legacy indicator is defined as a constructor function, executes function ", function () {
                const mockConstructorFunction = jasmine.createSpy('mockIndicatorConstructor');
                const legacyIndicators = [{}, mockConstructorFunction];

                mockConstructorFunction.and.returnValue({});
                legacyIndicatorsRunsFunction(legacyIndicators);
                renderIndicators();

                expect(holderElement.children.length).toBe(legacyIndicators.length);
                expect(mockConstructorFunction).toHaveBeenCalled();
            });

            function renderIndicators() {
                directive.link({}, holderElement);
            }
        });
    }
);
