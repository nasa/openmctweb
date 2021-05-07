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
    ['../../src/directives/MCTScroll'],
    function (MCTScroll) {

        var EVENT_PROPERTY = "testProperty",
            ATTRIBUTE = "testAttribute",
            EXPRESSION = "some.expression";

        // MCTScroll is the commonality between mct-scroll-x and
        // mct-scroll-y; it gets the event property to watch and
        // the attribute which contains the associated assignable
        // expression.
        describe("An mct-scroll-* directive", function () {
            var mockParse,
                mockParsed,
                mockScope,
                mockElement,
                testAttrs,
                mctScroll;

            beforeEach(function () {
                mockParse = jasmine.createSpy('$parse');
                mockParsed = jasmine.createSpy('parsed');
                mockParsed.assign = jasmine.createSpy('assign');

                mockScope = jasmine.createSpyObj('$scope', ['$watch', '$apply']);
                mockElement = [{ testProperty: 42 }];
                mockElement.on = jasmine.createSpy('on');

                mockParse.and.returnValue(mockParsed);

                testAttrs = {};
                testAttrs[ATTRIBUTE] = EXPRESSION;

                mctScroll = new MCTScroll(
                    mockParse,
                    EVENT_PROPERTY,
                    ATTRIBUTE
                );
                mctScroll.link(mockScope, mockElement, testAttrs);
            });

            it("is available for attributes", function () {
                expect(mctScroll.restrict).toEqual('A');
            });

            it("does not create an isolate scope", function () {
                expect(mctScroll.scope).toBeUndefined();
            });

            it("watches for changes in observed expression", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    EXPRESSION,
                    jasmine.any(Function)
                );
                // Should have been only watch (other tests need this to be true)
                expect(mockScope.$watch.calls.count()).toEqual(1);
            });

            it("listens for scroll events", function () {
                expect(mockElement.on).toHaveBeenCalledWith(
                    'scroll',
                    jasmine.any(Function)
                );
                // Should have been only listener (other tests need this to be true)
                expect(mockElement.on.calls.count()).toEqual(1);
            });

            it("publishes initial scroll state", function () {
                expect(mockParse).toHaveBeenCalledWith(EXPRESSION);
                expect(mockParsed.assign).toHaveBeenCalledWith(mockScope, 42);
            });

            it("updates scroll state when scope changes", function () {
                mockScope.$watch.calls.mostRecent().args[1](64);
                expect(mockElement[0].testProperty).toEqual(64);
            });

            it("updates scope when scroll state changes", function () {
                mockElement[0].testProperty = 12321;
                mockElement.on.calls.mostRecent().args[1]({ target: mockElement[0] });
                expect(mockParsed.assign).toHaveBeenCalledWith(mockScope, 12321);
                expect(mockScope.$apply).toHaveBeenCalledWith(EXPRESSION);
            });

            // This would trigger an infinite digest exception
            it("does not call $apply during construction", function () {
                expect(mockScope.$apply).not.toHaveBeenCalled();
            });

        });
    }
);
