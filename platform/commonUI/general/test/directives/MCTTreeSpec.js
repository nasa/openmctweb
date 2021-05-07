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
    '../../src/directives/MCTTree',
    '../../src/ui/TreeView'
], function (MCTTree, TreeView) {
    describe("The mct-tree directive", function () {
        var mockParse,
            mockGestureService,
            mockExpr,
            mctTree;

        function makeMockDomainObject(id) {
            var mockDomainObject = jasmine.createSpyObj('domainObject-' + id, [
                'getId',
                'getModel',
                'getCapability',
                'hasCapability'
            ]);
            mockDomainObject.getId.and.returnValue(id);
            mockDomainObject.getModel.and.returnValue({});

            return mockDomainObject;
        }

        beforeEach(function () {
            mockGestureService = jasmine.createSpyObj(
                'gestureService',
                ['attachGestures']
            );
            mockParse = jasmine.createSpy('$parse');
            mockExpr = jasmine.createSpy('expr');
            mockExpr.assign = jasmine.createSpy('assign');
            mockParse.and.returnValue(mockExpr);
            spyOn(TreeView.prototype, 'observe').and.callThrough();

            mctTree = new MCTTree(mockParse, mockGestureService);
        });

        it("is applicable as an element", function () {
            expect(mctTree.restrict).toEqual("E");
        });

        it("two-way binds", function () {
            expect(mctTree.scope).toEqual({
                rootObject: "=",
                selectedObject: "=",
                allowSelection: "=?",
                onSelection: "=?"
            });
        });

        describe("link", function () {
            var mockScope,
                mockElement,
                testAttrs;

            beforeEach(function () {
                mockScope =
                    jasmine.createSpyObj('$scope', ['$watch', '$on', '$apply']);
                mockElement = jasmine.createSpyObj('element', ['append']);
                testAttrs = { mctModel: "some-expression" };
                mockScope.$parent =
                    jasmine.createSpyObj('$scope', ['$watch', '$on']);
                mctTree.link(mockScope, mockElement, testAttrs);
            });

            it("populates the mct-tree element", function () {
                expect(mockElement.append).toHaveBeenCalled();
            });

            it("watches for selected-object expression in the parent", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "selectedObject",
                    jasmine.any(Function)
                );
            });

            it("watches for changes to root-object", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "rootObject",
                    jasmine.any(Function)
                );
            });

            it("listens for the $destroy event", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );
            });

            it("watches for changes in tree view", function () {

            });

            // https://github.com/nasa/openmct/issues/1114
            it("does not trigger $apply during $watches", function () {
                mockScope.mctObject = makeMockDomainObject('root');
                mockScope.mctMode = makeMockDomainObject('selection');
                mockScope.$watch.calls.all().forEach(function (call) {
                    call.args[1](mockScope[call.args[0]]);
                });
                expect(mockScope.$apply).not.toHaveBeenCalled();
            });
            it("does trigger $apply from tree manipulation", function () {
                if (/PhantomJS/g.test(window.navigator.userAgent)) {
                    console.log('Unable to run test in PhantomJS due to lack of support for event constructors');

                    return;
                }

                // White-boxy; we know this is the setter for the tree's value
                var treeValueFn = TreeView.prototype.observe.calls.all()[0].args[0];

                mockScope.mctObject = makeMockDomainObject('root');
                mockScope.mctMode = makeMockDomainObject('selection');

                treeValueFn(makeMockDomainObject('other'), new MouseEvent("click"));

                expect(mockScope.$apply).toHaveBeenCalled();
            });
        });
    });

});
