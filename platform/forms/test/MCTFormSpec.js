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
    ["../src/MCTForm"],
    function (MCTForm) {

        describe("The mct-form directive", function () {
            var mockScope,
                mctForm;

            function installController() {
                var Controller = mctForm.controller[1];

                return new Controller(mockScope);
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockScope.$parent = {};
                mctForm = new MCTForm();
            });

            it("is restricted to elements", function () {
                expect(mctForm.restrict).toEqual("E");
            });

            it("watches for changes in form by name", function () {
                // mct-form needs to watch for the form by name
                // in order to convey changes in $valid, $dirty, etc
                // up to the parent scope.
                installController();

                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "mctForm",
                    jasmine.any(Function)
                );
            });

            it("conveys form status to parent scope", function () {
                var someState = { someKey: "some value" };
                mockScope.name = "someName";

                installController();

                mockScope.$watch.calls.mostRecent().args[1](someState);

                expect(mockScope.$parent.someName).toBe(someState);
            });

            it("allows strings to be converted to RegExps", function () {
                // This is needed to support ng-pattern in the template
                installController();

                // Should have added getRegExp to the scope,
                // to convert strings to regular expressions
                expect(mockScope.getRegExp("^\\d+$")).toEqual(/^\d+$/);
            });

            it("returns the same regexp instance for the same string", function () {
                // Don't want new instances each digest cycle, for performance
                var strRegExp = "^[a-z]\\d+$",
                    regExp;

                // Add getRegExp to scope
                installController();
                regExp = mockScope.getRegExp(strRegExp);

                // Same object instance each time...
                expect(mockScope.getRegExp(strRegExp)).toBe(regExp);
                expect(mockScope.getRegExp(strRegExp)).toBe(regExp);
            });

            it("passes RegExp objects through untouched", function () {
                // Permit using forms to simply provide their own RegExp object
                var regExp = /^\d+[a-d]$/;

                // Add getRegExp to scope
                installController();

                // Should have added getRegExp to the scope,
                // to convert strings to regular expressions
                expect(mockScope.getRegExp(regExp)).toBe(regExp);
            });

            it("passes a non-whitespace regexp when no pattern is defined", function () {
                // If no pattern is supplied, ng-pattern should match anything
                installController();
                expect(mockScope.getRegExp()).toEqual(/\S/);
                expect(mockScope.getRegExp(undefined)).toEqual(/\S/);
            });

        });
    }
);
