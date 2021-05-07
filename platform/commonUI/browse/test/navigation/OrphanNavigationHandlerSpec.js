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

define([
    '../../src/navigation/OrphanNavigationHandler'
], function (OrphanNavigationHandler) {
    describe("OrphanNavigationHandler", function () {
        var mockTopic,
            mockThrottle,
            mockMutationTopic,
            mockNavigationService,
            mockDomainObject,
            mockParentObject,
            mockContext,
            mockActionCapability,
            mockEditor,
            testParentComposition,
            testId,
            mockThrottledFns;

        beforeEach(function () {
            testId = 'some-identifier';

            mockThrottledFns = [];

            mockTopic = jasmine.createSpy('topic');
            mockThrottle = jasmine.createSpy('throttle');
            mockNavigationService = jasmine.createSpyObj('navigationService', [
                'getNavigation',
                'addListener'
            ]);
            mockMutationTopic = jasmine.createSpyObj('mutationTopic', [
                'listen'
            ]);
            mockDomainObject = jasmine.createSpyObj('domainObject', [
                'getId',
                'getCapability',
                'hasCapability'
            ]);
            mockParentObject = jasmine.createSpyObj('domainObject', [
                'getId',
                'getCapability',
                'useCapability'
            ]);
            mockContext = jasmine.createSpyObj('context', ['getParent']);
            mockActionCapability = jasmine.createSpyObj('action', ['perform']);
            mockEditor = jasmine.createSpyObj('editor', ['isEditContextRoot']);

            mockThrottle.and.callFake(function (fn) {
                var mockThrottledFn =
                    jasmine.createSpy('throttled-' + mockThrottledFns.length);
                mockThrottledFn.and.callFake(fn);
                mockThrottledFns.push(mockThrottledFn);

                return mockThrottledFn;
            });
            mockTopic.and.returnValue(mockMutationTopic);
            mockDomainObject.getId.and.returnValue(testId);
            mockDomainObject.getCapability.and.callFake(function (c) {
                return {
                    context: mockContext,
                    editor: mockEditor
                }[c];
            });
            mockDomainObject.hasCapability.and.callFake(function (c) {
                return Boolean(mockDomainObject.getCapability(c));
            });
            mockParentObject.getCapability.and.callFake(function (c) {
                return {
                    action: mockActionCapability
                }[c];
            });
            testParentComposition = [];
            mockParentObject.useCapability.and.returnValue(Promise.resolve(testParentComposition));

            mockContext.getParent.and.returnValue(mockParentObject);
            mockNavigationService.getNavigation.and.returnValue(mockDomainObject);
            mockEditor.isEditContextRoot.and.returnValue(false);

            return new OrphanNavigationHandler(
                mockThrottle,
                mockTopic,
                mockNavigationService
            );
        });

        it("listens for mutation with a throttled function", function () {
            expect(mockMutationTopic.listen)
                .toHaveBeenCalledWith(jasmine.any(Function));
            expect(mockThrottledFns.indexOf(
                mockMutationTopic.listen.calls.mostRecent().args[0]
            )).not.toEqual(-1);
        });

        it("listens for navigation changes with a throttled function", function () {
            expect(mockNavigationService.addListener)
                .toHaveBeenCalledWith(jasmine.any(Function));
            expect(mockThrottledFns.indexOf(
                mockNavigationService.addListener.calls.mostRecent().args[0]
            )).not.toEqual(-1);
        });

        [false, true].forEach(function (isOrphan) {
            var prefix = isOrphan ? "" : "non-";
            describe("for " + prefix + "orphan objects", function () {
                beforeEach(function () {
                    if (!isOrphan) {
                        testParentComposition.push(mockDomainObject);
                    }
                });

                [false, true].forEach(function (isEditRoot) {
                    var caseName = isEditRoot
                        ? "that are being edited" : "that are not being edited";

                    function itNavigatesAsExpected() {
                        if (isOrphan && !isEditRoot) {
                            it("navigates to the parent", function () {
                                return Promise.resolve().then(function () {
                                    expect(mockActionCapability.perform)
                                        .toHaveBeenCalledWith('navigate');
                                });
                            });
                        } else {
                            it("does nothing", function () {
                                return Promise.resolve().then(function () {
                                    expect(mockActionCapability.perform)
                                        .not.toHaveBeenCalled();
                                });
                            });
                        }
                    }

                    describe(caseName, function () {
                        beforeEach(function () {
                            mockEditor.isEditContextRoot.and.returnValue(isEditRoot);
                        });

                        describe("when navigation changes", function () {
                            beforeEach(function () {
                                mockNavigationService.addListener.calls.mostRecent()
                                    .args[0](mockDomainObject);
                            });
                            itNavigatesAsExpected();
                        });

                        describe("when mutation occurs", function () {
                            beforeEach(function () {
                                mockMutationTopic.listen.calls.mostRecent()
                                    .args[0](mockParentObject);
                            });

                            itNavigatesAsExpected();
                        });

                    });
                });
            });
        });

    });
});

