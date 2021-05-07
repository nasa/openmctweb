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
    ["../src/StyleSheetLoader"],
    function (StyleSheetLoader) {

        describe("The style sheet loader", function () {
            var testStyleSheets,
                mockDocument,
                mockPlainDocument,
                mockHead,
                mockElement,
                testBundle,
                loader; // eslint-disable-line

            beforeEach(function () {
                testBundle = {
                    path: "a/b",
                    resources: "c"
                };

                testStyleSheets = [
                    {
                        stylesheetUrl: "d.css",
                        bundle: testBundle
                    },
                    {
                        stylesheetUrl: "e.css",
                        bundle: testBundle
                    },
                    {
                        stylesheetUrl: "f.css",
                        bundle: testBundle
                    }
                ];

                mockPlainDocument =
                    jasmine.createSpyObj("document", ["createElement"]);
                mockDocument = [mockPlainDocument];
                mockDocument.find = jasmine.createSpy("$document.find");
                mockHead = jasmine.createSpyObj("head", ["append"]);
                mockElement = jasmine.createSpyObj("link", ["setAttribute"]);

                mockDocument.find.and.returnValue(mockHead);
                mockPlainDocument.createElement.and.returnValue(mockElement);

                loader = new StyleSheetLoader(testStyleSheets, mockDocument);
            });

            it("appends one link per stylesheet extension", function () {
                expect(mockHead.append.calls.count())
                    .toEqual(testStyleSheets.length);
            });

            it("appends links to the head", function () {
                expect(mockDocument.find).toHaveBeenCalledWith('head');
            });

            it("adjusts link locations", function () {
                expect(mockElement.setAttribute)
                    .toHaveBeenCalledWith('href', "./a/b/c/d.css");
            });

            describe("for themed stylesheets", function () {
                var testTheme = "test-theme";

                beforeEach(function () {
                    testStyleSheets = [{
                        stylesheetUrl: "themed.css",
                        bundle: testBundle,
                        theme: testTheme
                    }, {
                        stylesheetUrl: "bad-theme.css",
                        bundle: testBundle,
                        theme: 'bad-theme'
                    }];

                    loader = new StyleSheetLoader(
                        testStyleSheets,
                        mockDocument,
                        testTheme
                    );
                });

                it("includes matching themes", function () {
                    expect(mockElement.setAttribute)
                        .toHaveBeenCalledWith('href', "./a/b/c/themed.css");
                });

                it("excludes mismatching themes", function () {
                    expect(mockElement.setAttribute)
                        .not
                        .toHaveBeenCalledWith('href', "./a/b/c/bad-theme.css");
                });
            });

        });
    }
);

