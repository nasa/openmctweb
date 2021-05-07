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
    ["../../src/controllers/EditPanesController"],
    function (EditPanesController) {

        describe("The Edit Panes controller", function () {
            var mockScope,
                mockDomainObject,
                mockContext,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability']
                );
                mockContext = jasmine.createSpyObj(
                    'context',
                    ['getTrueRoot']
                );

                mockDomainObject.getId.and.returnValue('test-id');
                mockDomainObject.getCapability.and.returnValue(mockContext);

                // Return a new instance of the root object each time
                mockContext.getTrueRoot.and.callFake(function () {
                    var mockRoot = jasmine.createSpyObj('root', ['getId']);
                    mockRoot.getId.and.returnValue('root-id');

                    return mockRoot;
                });

                controller = new EditPanesController(mockScope);
            });

            it("watches for the domain object in view", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });

            it("exposes the root object found via the object's context capability", function () {
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                // Verify that the correct capability was used
                expect(mockDomainObject.getCapability)
                    .toHaveBeenCalledWith('context');

                // Should have exposed the root from getRoot
                expect(controller.getRoot().getId()).toEqual('root-id');
            });

            it("preserves the same root instance to avoid excessive refreshing", function () {
                var firstRoot;
                // Expose the domain object
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                firstRoot = controller.getRoot();
                // Update!
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                // Should still have the same object instance, to avoid
                // triggering the watch used by the template we're supporting
                expect(controller.getRoot()).toBe(firstRoot);
            });

            // Complements the test above; the object pointed to should change
            // when the actual root has changed (detected by identifier)
            it("updates the root when it changes", function () {
                var firstRoot;
                // Expose the domain object
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);
                firstRoot = controller.getRoot();

                // Change the exposed root
                mockContext.getTrueRoot.and.callFake(function () {
                    var mockRoot = jasmine.createSpyObj('root', ['getId']);
                    mockRoot.getId.and.returnValue('other-root-id');

                    return mockRoot;
                });

                // Update!
                mockScope.$watch.calls.mostRecent().args[1](mockDomainObject);

                // Should still have the same object instance, to avoid
                // triggering the watch used by the template we're supporting
                expect(controller.getRoot()).not.toBe(firstRoot);
                expect(controller.getRoot().getId()).toEqual('other-root-id');
            });
        });
    }
);
