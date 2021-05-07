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
    ["./ExportService", "csv"],
    function (ExportService, CSV) {

        describe("ExportService", function () {
            var mockSaveAs,
                testRows,
                csvContents,
                readCSVPromise,
                exportService;

            beforeEach(function () {
                var resolveFunction;
                csvContents = undefined;
                testRows = [
                    {
                        a: 1,
                        b: 2,
                        c: 3
                    },
                    {
                        a: 4,
                        b: 5,
                        c: 6
                    },
                    {
                        a: 7,
                        b: 8,
                        c: 9
                    }
                ];
                mockSaveAs = jasmine.createSpy('saveAs');
                readCSVPromise = new Promise(function (resolve) {
                    resolveFunction = resolve;
                });
                mockSaveAs.and.callFake(function (blob) {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        csvContents = new CSV(reader.result).parse();
                        resolveFunction();
                    };

                    reader.readAsText(blob);
                });
                exportService = new ExportService(mockSaveAs);
            });

            describe("#exportCSV(rows)", function () {
                beforeEach(function () {
                    exportService.exportCSV(testRows);

                    return readCSVPromise;
                });

                it("triggers saving of a file", function () {
                    expect(mockSaveAs).toHaveBeenCalledWith(
                        jasmine.any(Blob),
                        jasmine.any(String)
                    );
                });

                it("includes headers from the data set", function () {
                    expect(csvContents[0])
                        .toEqual(Object.keys(testRows[0]).sort());
                });

                it("includes data from the data set", function () {
                    var headers = csvContents[0],
                        expectedData = testRows.map(function (row) {
                            return headers.map(function (key) {
                                return String(row[key]);
                            });
                        });
                    // Everything after header should be data
                    expect(csvContents.slice(1)).toEqual(expectedData);
                });
            });

            describe("#exportCSV(rows, options.headers)", function () {
                var testHeaders;

                beforeEach(function () {
                    testHeaders = ['a', 'b'];
                    exportService
                        .exportCSV(testRows, { headers: testHeaders });

                    return readCSVPromise;
                });

                it("triggers saving of a file", function () {
                    expect(mockSaveAs).toHaveBeenCalledWith(
                        jasmine.any(Blob),
                        jasmine.any(String)
                    );
                });

                it("includes only the specified headers", function () {
                    expect(csvContents[0])
                        .toEqual(testHeaders);
                    expect(csvContents[0])
                        .not.toEqual(Object.keys(testRows[0]).sort());
                });

                it("includes a subset data from the data set", function () {
                    var headers = testHeaders,
                        expectedData = testRows.map(function (row) {
                            return headers.map(function (key) {
                                return String(row[key]);
                            });
                        });
                    expect(csvContents.slice(1)).toEqual(expectedData);
                });
            });

            describe("#exportCSV(rows, options.filename)", function () {
                var testFilename;

                beforeEach(function () {
                    testFilename = "some-test-filename.csv";
                    exportService
                        .exportCSV(testRows, { filename: testFilename });

                    return readCSVPromise;
                });

                it("saves a file with the specified name", function () {
                    expect(mockSaveAs).toHaveBeenCalledWith(
                        jasmine.any(Blob),
                        testFilename
                    );
                });
            });

        });

    }
);
