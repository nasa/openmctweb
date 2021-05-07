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
    ["../src/StatusRepresenter", "../src/StatusConstants"],
    function (StatusRepresenter, StatusConstants) {

        describe("The status representer", function () {
            var mockScope,
                mockElement,
                testRepresentation,
                mockDomainObject,
                mockStatusCapability,
                mockUnlisten,
                elementClasses,
                testStatusFlags,
                representer;

            function verifyClasses() {
                expect(Object.keys(elementClasses).sort())
                    .toEqual(testStatusFlags.map(function (s) {
                        return StatusConstants.CSS_CLASS_PREFIX + s;
                    }).sort());
            }

            function updateStatus(newFlags) {
                testStatusFlags = newFlags;
                mockStatusCapability.get.and.returnValue(newFlags);
                mockStatusCapability.listen.calls.mostRecent()
                    .args[0](newFlags);
            }

            beforeEach(function () {
                testStatusFlags = ['x', 'y', 'z'];

                mockScope = {};
                mockElement = jasmine.createSpyObj('element', [
                    'addClass',
                    'removeClass'
                ]);
                testRepresentation = { key: "someKey" };
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getModel', 'getId', 'getCapability']
                );
                mockStatusCapability = jasmine.createSpyObj(
                    'status',
                    ['list', 'get', 'set', 'listen']
                );
                mockUnlisten = jasmine.createSpy();

                elementClasses = {};

                mockElement.addClass.and.callFake(function (c) {
                    elementClasses[c] = true;
                });
                mockElement.removeClass.and.callFake(function (c) {
                    delete elementClasses[c];
                });

                mockStatusCapability.list.and.returnValue(testStatusFlags);
                mockStatusCapability.listen.and.returnValue(mockUnlisten);

                mockDomainObject.getCapability.and.callFake(function (c) {
                    return c === 'status' && mockStatusCapability;
                });

                representer = new StatusRepresenter(mockScope, mockElement);
                representer.represent(testRepresentation, mockDomainObject);
            });

            it("listens for status changes", function () {
                expect(mockStatusCapability.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("initially sets classes to reflect status", verifyClasses);

            it("changes classes on status change callbacks", function () {
                updateStatus(['a', 'x', '123']);
                verifyClasses();
            });

            it("stops listening when destroyed", function () {
                expect(mockUnlisten).not.toHaveBeenCalled();
                representer.destroy();
                expect(mockUnlisten).toHaveBeenCalled();
            });

            it("removes status classes when destroyed", function () {
                expect(elementClasses).not.toEqual({});
                representer.destroy();
                expect(elementClasses).toEqual({});
            });
        });
    }
);
