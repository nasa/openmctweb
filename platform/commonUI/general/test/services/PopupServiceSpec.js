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
    ["../../src/services/PopupService"],
    function (PopupService) {

        describe("PopupService", function () {
            var mockDocument,
                testWindow,
                mockBody,
                mockElement,
                popupService;

            beforeEach(function () {
                mockDocument = jasmine.createSpyObj('$document', ['find']);
                testWindow = {
                    innerWidth: 1000,
                    innerHeight: 800
                };
                mockBody = jasmine.createSpyObj('body', ['append']);
                mockElement = jasmine.createSpyObj('element', [
                    'css',
                    'remove'
                ]);

                mockDocument.find.and.callFake(function (query) {
                    return query === 'body' && mockBody;
                });

                popupService = new PopupService(mockDocument, testWindow);
            });

            it("adds elements to the body of the document", function () {
                popupService.display(mockElement, [0, 0]);
                expect(mockBody.append).toHaveBeenCalledWith(mockElement);
            });

            describe("when positioned in appropriate quadrants", function () {
                it("orients elements relative to the top-left", function () {
                    popupService.display(mockElement, [25, 50]);
                    expect(mockElement.css).toHaveBeenCalledWith({
                        position: 'absolute',
                        left: '25px',
                        top: '50px'
                    });
                });

                it("orients elements relative to the top-right", function () {
                    popupService.display(mockElement, [800, 50]);
                    expect(mockElement.css).toHaveBeenCalledWith({
                        position: 'absolute',
                        right: '200px',
                        top: '50px'
                    });
                });

                it("orients elements relative to the bottom-right", function () {
                    popupService.display(mockElement, [800, 650]);
                    expect(mockElement.css).toHaveBeenCalledWith({
                        position: 'absolute',
                        right: '200px',
                        bottom: '150px'
                    });
                });

                it("orients elements relative to the bottom-left", function () {
                    popupService.display(mockElement, [120, 650]);
                    expect(mockElement.css).toHaveBeenCalledWith({
                        position: 'absolute',
                        left: '120px',
                        bottom: '150px'
                    });
                });
            });

        });
    }
);
