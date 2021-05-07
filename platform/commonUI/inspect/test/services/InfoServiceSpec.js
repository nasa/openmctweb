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
    ['../../src/services/InfoService'],
    function (InfoService) {

        describe("The info service", function () {
            var mockCompile,
                mockRootScope,
                mockPopupService,
                mockAgentService,
                mockScope,
                mockElements,
                mockPopup,
                service;

            beforeEach(function () {
                mockCompile = jasmine.createSpy('$compile');
                mockRootScope = jasmine.createSpyObj('$rootScope', ['$new']);
                mockAgentService = jasmine.createSpyObj('agentService', ['isMobile', 'isPhone']);
                mockPopupService = jasmine.createSpyObj(
                    'popupService',
                    ['display']
                );
                mockPopup = jasmine.createSpyObj('popup', [
                    'dismiss',
                    'goesLeft',
                    'goesRight',
                    'goesUp',
                    'goesDown'
                ]);

                mockScope = jasmine.createSpyObj("scope", ["$destroy"]);
                mockElements = [];

                mockPopupService.display.and.returnValue(mockPopup);
                mockCompile.and.callFake(function () {
                    var mockCompiledTemplate = jasmine.createSpy('template'),
                        mockElement = jasmine.createSpyObj('element', [
                            'css',
                            'remove',
                            'append'
                        ]);
                    mockCompiledTemplate.and.returnValue(mockElement);
                    mockElements.push(mockElement);

                    return mockCompiledTemplate;
                });
                mockRootScope.$new.and.returnValue(mockScope);

                service = new InfoService(
                    mockCompile,
                    mockRootScope,
                    mockPopupService,
                    mockAgentService
                );
            });

            it("creates elements and displays them as popups", function () {
                service.display('', '', {}, [123, 456]);
                expect(mockPopupService.display).toHaveBeenCalledWith(
                    mockElements[0],
                    [123, 456],
                    jasmine.any(Object)
                );
            });

            it("provides a function to remove displayed info bubbles", function () {
                var fn = service.display('', '', {}, [0, 0]);
                expect(mockPopup.dismiss).not.toHaveBeenCalled();
                fn();
                expect(mockPopup.dismiss).toHaveBeenCalled();
            });

            it("when on phone device, positions at  bottom", function () {
                mockAgentService.isPhone.and.returnValue(true);
                service = new InfoService(
                    mockCompile,
                    mockRootScope,
                    mockPopupService,
                    mockAgentService
                );
                service.display('', '', {}, [123, 456]);
                expect(mockPopupService.display).toHaveBeenCalledWith(
                    mockElements[0],
                    [0, -25],
                    jasmine.any(Object)
                );
            });

            [false, true].forEach(function (goesLeft) {
                [false, true].forEach(function (goesUp) {
                    var vertical = goesUp ? "up" : "down",
                        horizontal = goesLeft ? "left" : "right",
                        location = [vertical, horizontal].join('-');
                    describe("when bubble goes " + location, function () {
                        var expectedLocation = [
                            goesUp ? "bottom" : "top",
                            goesLeft ? "right" : "left"
                        ].join('-');

                        beforeEach(function () {
                            mockPopup.goesUp.and.returnValue(goesUp);
                            mockPopup.goesDown.and.returnValue(!goesUp);
                            mockPopup.goesLeft.and.returnValue(goesLeft);
                            mockPopup.goesRight.and.returnValue(!goesLeft);
                            service.display('', '', {}, [10, 10]);
                        });

                        it("positions the arrow in the " + expectedLocation, function () {
                            expect(mockScope.bubbleLayout).toEqual([
                                goesUp ? "arw-btm" : "arw-top",
                                goesLeft ? "arw-right" : "arw-left"
                            ].join(' '));
                        });
                    });
                });
            });

        });
    }
);
