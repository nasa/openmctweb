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
    ["../../src/directives/MCTSplitter"],
    function (MCTSplitter) {

        describe("The mct-splitter directive", function () {
            var mctSplitter;

            beforeEach(function () {
                mctSplitter = new MCTSplitter();
            });

            it("is applicable to elements", function () {
                expect(mctSplitter.restrict).toEqual("E");
            });

            it("depends on the mct-split-pane controller", function () {
                expect(mctSplitter.require).toEqual("^mctSplitPane");
            });

            describe("when linked", function () {
                var mockScope,
                    mockElement,
                    testAttrs,
                    mockSplitPane;

                beforeEach(function () {
                    mockScope = jasmine.createSpyObj(
                        '$scope',
                        ['$on', '$watch']
                    );
                    mockElement = jasmine.createSpyObj(
                        'element',
                        ['addClass']
                    );
                    testAttrs = {};
                    mockSplitPane = jasmine.createSpyObj(
                        'mctSplitPane',
                        ['position', 'startResizing', 'endResizing', 'anchor']
                    );

                    mctSplitter.link(
                        mockScope,
                        mockElement,
                        testAttrs,
                        mockSplitPane
                    );
                });

                it("adds a splitter class", function () {
                    expect(mockElement.addClass)
                        .toHaveBeenCalledWith('splitter');
                });

                describe("and then manipulated", function () {
                    var testPosition;

                    beforeEach(function () {
                        testPosition = 12321;
                        mockSplitPane.position.and.returnValue(testPosition);
                        mockSplitPane.anchor.and.returnValue({
                            orientation: 'vertical',
                            reversed: false
                        });
                        mockScope.splitter.startMove();
                    });

                    it("tell's the splitter when it is resizing", function () {
                        expect(mockSplitPane.startResizing)
                            .toHaveBeenCalled();
                    });

                    it("repositions during drag", function () {
                        mockScope.splitter.move([10, 0]);
                        expect(mockSplitPane.position)
                            .toHaveBeenCalledWith(testPosition + 10);
                    });

                    it("tell's the splitter when it is done resizing", function () {
                        mockScope.splitter.move([10, 0]);
                        mockScope.splitter.endMove();
                        expect(mockSplitPane.endResizing).toHaveBeenCalledWith(testPosition + 10);
                    });

                });
            });
        });
    }
);
