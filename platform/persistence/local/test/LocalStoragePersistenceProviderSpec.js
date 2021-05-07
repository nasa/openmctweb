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
    ["../src/LocalStoragePersistenceProvider"],
    function (LocalStoragePersistenceProvider) {

        describe("The local storage persistence provider", function () {
            var mockQ,
                testSpace = "testSpace",
                mockCallback,
                testLocalStorage,
                provider;

            function mockPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                testLocalStorage = {};

                mockQ = jasmine.createSpyObj("$q", ["when", "reject"]);
                mockCallback = jasmine.createSpy('callback');

                mockQ.when.and.callFake(mockPromise);

                provider = new LocalStoragePersistenceProvider(
                    { localStorage: testLocalStorage },
                    mockQ,
                    testSpace
                );
            });

            it("reports available spaces", function () {
                provider.listSpaces().then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith([testSpace]);
            });

            it("lists all available documents", function () {
                provider.listObjects(testSpace).then(mockCallback);
                expect(mockCallback.calls.mostRecent().args[0]).toEqual([]);
                provider.createObject(testSpace, 'abc', { a: 42 });
                provider.listObjects(testSpace).then(mockCallback);
                expect(mockCallback.calls.mostRecent().args[0]).toEqual(['abc']);
            });

            it("allows object creation", function () {
                var model = { someKey: "some value" };
                provider.createObject(testSpace, "abc", model)
                    .then(mockCallback);
                expect(JSON.parse(testLocalStorage[testSpace]).abc)
                    .toEqual(model);
                expect(mockCallback.calls.mostRecent().args[0]).toBeTruthy();
            });

            it("allows object models to be read back", function () {
                var model = { someKey: "some other value" };
                testLocalStorage[testSpace] = JSON.stringify({ abc: model });
                provider.readObject(testSpace, "abc").then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith(model);
            });

            it("allows object update", function () {
                var model = { someKey: "some new value" };
                testLocalStorage[testSpace] = JSON.stringify({
                    abc: { somethingElse: 42 }
                });
                provider.updateObject(testSpace, "abc", model)
                    .then(mockCallback);
                expect(JSON.parse(testLocalStorage[testSpace]).abc)
                    .toEqual(model);
            });

            it("allows object deletion", function () {
                testLocalStorage[testSpace] = JSON.stringify({
                    abc: { somethingElse: 42 }
                });
                provider.deleteObject(testSpace, "abc").then(mockCallback);
                expect(testLocalStorage[testSpace].abc)
                    .toBeUndefined();
            });

            it("returns undefined when objects are not found", function () {
                provider.readObject("testSpace", "abc").then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith(undefined);
            });

        });
    }
);
