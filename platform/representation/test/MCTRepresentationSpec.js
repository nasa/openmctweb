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

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/MCTRepresentation"],
    function (MCTRepresentation) {

        var JQLITE_FUNCTIONS = ["on", "off", "attr", "removeAttr"],
            LOG_FUNCTIONS = ["error", "warn", "info", "debug"],
            DOMAIN_OBJECT_METHODS = ["getId", "getModel", "getCapability", "hasCapability", "useCapability"];

        describe("The mct-representation directive", function () {
            var testRepresentations,
                testViews,
                testUrls,
                mockRepresenters,
                mockMutationCapability,
                mockQ,
                mockLinker,
                mockLog,
                mockChangeTemplate,
                mockScope,
                mockElement,
                mockDomainObject,
                testModel,
                mctRepresentation;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            function fireWatch(expr, value) {
                mockScope.$watch.calls.all().forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                testUrls = {};

                testRepresentations = [
                    {
                        key: "abc",
                        bundle: {
                            path: "a",
                            resources: "b"
                        },
                        templateUrl: "c/template.html"
                    },
                    {
                        key: "def",
                        bundle: {
                            path: "d",
                            resources: "e"
                        },
                        templateUrl: "f/template.html",
                        uses: ["testCapability", "otherTestCapability"]
                    }
                ];

                testViews = [
                    {
                        key: "uvw",
                        bundle: {
                            path: "u",
                            resources: "v"
                        },
                        templateUrl: "w/template.html",
                        gestures: ["testGesture", "otherTestGesture"]
                    },
                    {
                        key: "xyz",
                        bundle: {
                            path: "x",
                            resources: "y"
                        },
                        templateUrl: "z/template.html"
                    }
                ];

                testModel = { someKey: "some value" };

                testUrls = {};
                testViews.concat(testRepresentations).forEach(function (t, i) {
                    testUrls[t.key] = "some URL " + String(i);
                });

                mockRepresenters = ["A", "B"].map(function (name) {
                    var constructor = jasmine.createSpy("Representer" + name),
                        representer = jasmine.createSpyObj(
                            "representer" + name,
                            ["represent", "destroy"]
                        );
                    constructor.and.returnValue(representer);

                    return constructor;
                });

                mockQ = { when: mockPromise };
                mockLinker = jasmine.createSpyObj(
                    'templateLinker',
                    ['link', 'getPath']
                );
                mockChangeTemplate = jasmine.createSpy('changeTemplate');
                mockLog = jasmine.createSpyObj("$log", LOG_FUNCTIONS);

                mockMutationCapability =
                    jasmine.createSpyObj("mutation", ["listen"]);

                mockScope = jasmine.createSpyObj("scope", ["$watch", "$on"]);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.and.returnValue(testModel);
                mockLinker.link.and.returnValue(mockChangeTemplate);
                mockLinker.getPath.and.callFake(function (ext) {
                    return testUrls[ext.key];
                });

                mockDomainObject.getCapability.and.callFake(function (c) {
                    return c === 'mutation' && mockMutationCapability;
                });

                mctRepresentation = new MCTRepresentation(
                    testRepresentations,
                    testViews,
                    mockRepresenters,
                    mockQ,
                    mockLinker,
                    mockLog
                );
                mctRepresentation.link(mockScope, mockElement);
            });

            it("is restricted to elements", function () {
                expect(mctRepresentation.restrict).toEqual("E");
            });

            it("exposes templates via the templateLinker", function () {
                expect(mockLinker.link)
                    .toHaveBeenCalledWith(mockScope, mockElement);
            });

            it("watches scope when linked", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "key",
                    jasmine.any(Function)
                );
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });

            it("recognizes keys for representations", function () {
                mockScope.key = "abc";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watch
                fireWatch('key', mockScope.key);
                fireWatch('domainObject', mockDomainObject);

                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(testRepresentations[0]);
            });

            it("recognizes keys for views", function () {
                mockScope.key = "xyz";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watches
                fireWatch('key', mockScope.key);
                fireWatch('domainObject', mockDomainObject);

                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(testViews[1]);
            });

            it("does not load templates until there is an object", function () {
                mockScope.key = "xyz";

                // Trigger the watch
                fireWatch('key', mockScope.key);

                expect(mockChangeTemplate)
                    .not.toHaveBeenCalledWith(jasmine.any(Object));

                mockScope.domainObject = mockDomainObject;
                fireWatch('domainObject', mockDomainObject);

                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(jasmine.any(Object));
            });

            it("loads declared capabilities", function () {
                mockScope.key = "def";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watch
                mockScope.$watch.calls.all()[0].args[1]();

                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith("testCapability");
                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith("otherTestCapability");
            });

            it("logs when no representation is available for a key", function () {
                mockScope.key = "someUnknownThing";

                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Trigger the watch
                mockScope.$watch.calls.all()[0].args[1]();

                // Should have gotten a warning - that's an unknown key
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("clears out obsolete properties from scope", function () {
                mockScope.key = "def";
                mockScope.domainObject = mockDomainObject;
                mockDomainObject.useCapability.and.returnValue("some value");

                // Trigger the watch
                mockScope.$watch.calls.all()[0].args[1]();
                expect(mockScope.testCapability).toBeDefined();

                // Change the view
                mockScope.key = "xyz";

                // Trigger the watch again; should clear capability from scope
                mockScope.$watch.calls.all()[0].args[1]();
                expect(mockScope.testCapability).toBeUndefined();
            });

            describe("when a domain object has been observed", function () {
                var mockContext,
                    mockContext2,
                    mockLink,
                    mockParent;

                beforeEach(function () {
                    mockContext = jasmine.createSpyObj('context', ['getPath']);
                    mockContext2 = jasmine.createSpyObj('context', ['getPath']);
                    mockLink = jasmine.createSpyObj(
                        'linkedObject',
                        DOMAIN_OBJECT_METHODS
                    );
                    mockParent = jasmine.createSpyObj(
                        'parentObject',
                        DOMAIN_OBJECT_METHODS
                    );

                    mockDomainObject.getCapability.and.callFake(function (c) {
                        return {
                            context: mockContext,
                            mutation: mockMutationCapability
                        }[c];
                    });
                    mockLink.getCapability.and.callFake(function (c) {
                        return {
                            context: mockContext2,
                            mutation: mockMutationCapability
                        }[c];
                    });
                    mockDomainObject.hasCapability.and.callFake(function (c) {
                        return c === 'context';
                    });
                    mockLink.hasCapability.and.callFake(function (c) {
                        return c === 'context';
                    });
                    mockLink.getModel.and.returnValue({});

                    mockContext.getPath.and.returnValue([mockDomainObject]);
                    mockContext2.getPath.and.returnValue([mockParent, mockLink]);

                    mockLink.getId.and.returnValue('test-id');
                    mockDomainObject.getId.and.returnValue('test-id');

                    mockParent.getId.and.returnValue('parent-id');

                    mockScope.key = "abc";
                    mockScope.domainObject = mockDomainObject;

                    mockScope.$watch.calls.all()[0].args[1]();
                });

                it("listens for mutation of that object", function () {
                    expect(mockMutationCapability.listen)
                        .toHaveBeenCalledWith(jasmine.any(Function));
                });

                it("detects subsequent changes among linked instances", function () {
                    var callCount = mockChangeTemplate.calls.count();

                    mockScope.domainObject = mockLink;
                    mockScope.$watch.calls.all()[0].args[1]();

                    expect(mockChangeTemplate.calls.count())
                        .toEqual(callCount + 1);
                });

                it("does not trigger excess template changes for same instances", function () {
                    var callCount = mockChangeTemplate.calls.count();
                    mockScope.$watch.calls.all()[0].args[1]();
                    expect(mockChangeTemplate.calls.count()).toEqual(callCount);
                });

            });

        });
    }
);
