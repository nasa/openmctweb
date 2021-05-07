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
    ["../src/ElasticPersistenceProvider"],
    function (ElasticPersistenceProvider) {

        describe("The ElasticSearch persistence provider", function () {
            var mockHttp,
                mockQ,
                testSpace = "testSpace",
                testRoot = "/test",
                testPath = "db",
                capture,
                provider;

            function mockPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockHttp = jasmine.createSpy("$http");
                mockQ = jasmine.createSpyObj("$q", ["when", "reject"]);

                mockQ.when.and.callFake(mockPromise);
                mockQ.reject.and.callFake(function (value) {
                    return {
                        then: function (ignored, callback) {
                            return mockPromise(callback(value));
                        }
                    };
                });

                // Capture promise results
                capture = jasmine.createSpy("capture");

                provider = new ElasticPersistenceProvider(
                    mockHttp,
                    mockQ,
                    testSpace,
                    testRoot,
                    testPath
                );
            });

            it("reports available spaces", function () {
                provider.listSpaces().then(capture);
                expect(capture).toHaveBeenCalledWith([testSpace]);
            });

            // General pattern of tests below is to simulate ElasticSearch's
            // response, verify that request looks like what ElasticSearch
            // would expect, and finally verify that ElasticPersistenceProvider's
            // return values match what is expected.
            it("lists all available documents", function () {
                // Not implemented yet
                provider.listObjects().then(capture);
                expect(capture).toHaveBeenCalledWith([]);
            });

            it("allows object creation", function () {
                var model = { someKey: "some value" };
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_seq_no": 1,
                        "_primary_term": 1
                    }
                }));
                provider.createObject("testSpace", "abc", model).then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "PUT",
                    data: model,
                    params: undefined
                });
                expect(capture.calls.mostRecent().args[0]).toBeTruthy();
            });

            it("allows object models to be read back", function () {
                var model = { someKey: "some value" };
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_seq_no": 1,
                        "_primary_term": 1,
                        "_source": model
                    }
                }));
                provider.readObject("testSpace", "abc").then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "GET",
                    params: undefined,
                    data: undefined
                });
                expect(capture).toHaveBeenCalledWith(model);
            });

            it("allows object update", function () {
                var model = { someKey: "some value" };

                // First do a read to populate rev tags...
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_source": {}
                    }
                }));
                provider.readObject("testSpace", "abc");

                // Now perform an update
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_seq_no": 1,
                        "_source": {}
                    }
                }));
                provider.updateObject("testSpace", "abc", model).then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "PUT",
                    params: undefined,
                    data: model
                });
                expect(capture.calls.mostRecent().args[0]).toBeTruthy();
            });

            it("allows object deletion", function () {
                // First do a read to populate rev tags...
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_source": {}
                    }
                }));
                provider.readObject("testSpace", "abc");

                // Now perform an update
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_source": {}
                    }
                }));
                provider.deleteObject("testSpace", "abc", {}).then(capture);
                expect(mockHttp).toHaveBeenCalledWith({
                    url: "/test/db/abc",
                    method: "DELETE",
                    params: undefined,
                    data: undefined
                });
                expect(capture.calls.mostRecent().args[0]).toBeTruthy();
            });

            it("returns undefined when objects are not found", function () {
                // Act like a 404
                mockHttp.and.returnValue({
                    then: function (success, fail) {
                        return mockPromise(fail());
                    }
                });
                provider.readObject("testSpace", "abc").then(capture);
                expect(capture).toHaveBeenCalledWith(undefined);
            });

            it("handles rejection due to _seq_no", function () {
                var model = { someKey: "some value" },
                    mockErrorCallback = jasmine.createSpy('error');

                // First do a read to populate rev tags...
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_seq_no": 1,
                        "_source": {}
                    }
                }));
                provider.readObject("testSpace", "abc");

                // Now perform an update
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "status": 409,
                        "error": "Revision error..."
                    }
                }));
                provider.updateObject("testSpace", "abc", model).then(
                    capture,
                    mockErrorCallback
                );

                expect(capture).not.toHaveBeenCalled();
                expect(mockErrorCallback).toHaveBeenCalled();
            });

            it("handles rejection due to unknown reasons", function () {
                var model = { someKey: "some value" },
                    mockErrorCallback = jasmine.createSpy('error');

                // First do a read to populate rev tags...
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "_id": "abc",
                        "_seq_no": 1,
                        "_source": {}
                    }
                }));
                provider.readObject("testSpace", "abc");

                // Now perform an update
                mockHttp.and.returnValue(mockPromise({
                    data: {
                        "status": 410,
                        "error": "Revision error..."
                    }
                }));
                provider.updateObject("testSpace", "abc", model).then(
                    capture,
                    mockErrorCallback
                );

                expect(capture).not.toHaveBeenCalled();
                expect(mockErrorCallback).toHaveBeenCalled();
            });

        });
    }
);
