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
        '../../src/services/LocatingObjectDecorator',
        '../../../core/src/capabilities/ContextualDomainObject'
    ],
    function (LocatingObjectDecorator, ContextualDomainObject) {

        describe("LocatingObjectDecorator", function () {
            var mockQ,
                mockLog,
                mockObjectService,
                mockCallback,
                testObjects,
                testModels,
                decorator;

            function testPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return testPromise(callback(v));
                    }
                };
            }

            beforeEach(function () {
                // A <- B <- C
                // D <-> E, to verify cycle detection
                testModels = {
                    a: { name: "A" },
                    b: {
                        name: "B",
                        location: "a"
                    },
                    c: {
                        name: "C",
                        location: "b"
                    },
                    d: {
                        name: "D",
                        location: "e"
                    },
                    e: {
                        name: "E",
                        location: "d"
                    }
                };
                testObjects = {};

                mockQ = jasmine.createSpyObj("$q", ["when", "all"]);
                mockLog =
                    jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                mockObjectService =
                    jasmine.createSpyObj("objectService", ["getObjects"]);

                mockQ.when.and.callFake(testPromise);
                mockQ.all.and.callFake(function (promises) {
                    var result = {};
                    Object.keys(promises).forEach(function (k) {
                        promises[k].then(function (v) {
                            result[k] = v;
                        });
                    });

                    return testPromise(result);
                });

                mockObjectService.getObjects.and.returnValue(testPromise(testObjects));

                mockCallback = jasmine.createSpy("callback");

                Object.keys(testModels).forEach(function (id) {
                    testObjects[id] = jasmine.createSpyObj(
                        "domainObject-" + id,
                        ["getId", "getModel", "getCapability"]
                    );
                    testObjects[id].getId.and.returnValue(id);
                    testObjects[id].getModel.and.returnValue(testModels[id]);
                });

                decorator = new LocatingObjectDecorator(
                    mockQ,
                    mockLog,
                    mockObjectService
                );
            });

            it("contextualizes domain objects", function () {
                decorator.getObjects(['b', 'c']).then(mockCallback);
                expect(mockCallback).toHaveBeenCalled();

                var callbackObj = mockCallback.calls.mostRecent().args[0];
                expect(testObjects.b.getCapability('context')).not.toBeDefined();
                expect(testObjects.c.getCapability('context')).not.toBeDefined();
                expect(callbackObj.b.getCapability('context')).toBeDefined();
                expect(callbackObj.c.getCapability('context')).toBeDefined();
            });

            it("warns on cycle detection", function () {
                // Base case, no cycle, no warning
                decorator.getObjects(['a', 'b', 'c']);
                expect(mockLog.warn).not.toHaveBeenCalled();

                decorator.getObjects(['e']);
                expect(mockLog.warn).toHaveBeenCalled();
            });

        });
    }
);
