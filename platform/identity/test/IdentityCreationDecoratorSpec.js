/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/*global define,describe,beforeEach,it,jasmine,expect,Promise,waitsFor,runs */

define(
    [
        '../src/IdentityCreationDecorator'
    ],
    function (IdentityCreationDecorator) {
        "use strict";

        describe("IdentityCreationDecorator", function () {
            var mockIdentityService,
                mockCreationService,
                mockParent,
                mockCreatedObject,
                mockCallback,
                decorator;

            function calledBack() {
                return mockCallback.calls.length > 0;
            }

            beforeEach(function () {
                mockCallback = jasmine.createSpy('callback');
                mockIdentityService = jasmine.createSpyObj(
                    'identityService',
                    ['getUser']
                );
                mockCreationService = jasmine.createSpyObj(
                    'creationService',
                    ['createObject']
                );
                mockParent = jasmine.createSpyObj(
                    'parentObject',
                    ['getCapability', 'getId', 'getModel', 'hasCapability', 'useCapability']
                );
                mockCreatedObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'getId', 'getModel', 'hasCapability', 'useCapability']
                );
                mockCreationService.createObject
                    .andReturn(Promise.resolve(mockCreatedObject));
                mockIdentityService.getUser
                    .andReturn(Promise.resolve({ key: "test-user-id" }));
                mockParent.getId.andReturn('test-id');
                decorator = new IdentityCreationDecorator(
                    mockIdentityService,
                    mockCreationService
                );
            });

            it("delegates to its decorated service when identity is available", function () {
                var testModel = { someKey: "some value" };

                decorator.createObject(testModel, mockParent)
                    .then(mockCallback);

                waitsFor(calledBack);
                runs(function () {
                    expect(mockCallback)
                        .toHaveBeenCalledWith(mockCreatedObject);
                });
            });

            it("adds a creator property", function () {
                var testModel = { someKey: "some value" };

                decorator.createObject(testModel, mockParent)
                    .then(mockCallback);

                waitsFor(calledBack);
                runs(function () {
                    expect(mockCallback)
                        .toHaveBeenCalledWith(mockCreatedObject);
                    // Make sure arguments were delegated appropriately
                    expect(mockCreationService.createObject)
                        .toHaveBeenCalledWith(
                            { someKey: "some value", creator: "test-user-id" },
                            mockParent
                        );
                });
            });

        });
    }
);
