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
 * GestureProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/gestures/GestureProvider"],
    function (GestureProvider) {

        var JQLITE_FUNCTIONS = ["on", "off", "attr", "removeAttr"],
            GESTURE_KEYS = ["a", "b", "c", "d", "e"],
            DOMAIN_OBJECT_METHODS = ["getId", "getModel", "getCapability", "hasCapability", "useCapability"];

        describe("The gesture provider", function () {
            var mockGestures,
                mockDestroys,
                mockElement,
                mockDomainObject,
                provider;

            beforeEach(function () {
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);

                mockDestroys = {};
                mockGestures = {};
                GESTURE_KEYS.forEach(function (key) {
                    mockDestroys[key] = jasmine.createSpy("destroy-" + key);
                    mockGestures[key] = jasmine.createSpy("gesture-" + key);
                    mockGestures[key].and.returnValue({ destroy: mockDestroys[key] });
                    mockGestures[key].key = key;
                });

                provider = new GestureProvider(GESTURE_KEYS.map(function (key) {
                    return mockGestures[key];
                }));
            });

            it("attaches matching to an element", function () {
                provider.attachGestures(mockElement, mockDomainObject, ["a", "c", "e"]);

                expect(mockGestures.a).toHaveBeenCalledWith(mockElement, mockDomainObject);
                expect(mockGestures.c).toHaveBeenCalledWith(mockElement, mockDomainObject);
                expect(mockGestures.e).toHaveBeenCalledWith(mockElement, mockDomainObject);
                expect(mockGestures.b).not.toHaveBeenCalled();
                expect(mockGestures.d).not.toHaveBeenCalled();

                // No destroys should have been called - let's check
                GESTURE_KEYS.forEach(function (key) {
                    expect(mockDestroys[key]).not.toHaveBeenCalled();
                });
            });

            it("detaches gestures on request", function () {
                provider.attachGestures(
                    mockElement,
                    mockDomainObject,
                    ["b", "d", "e"]
                ).destroy();

                expect(mockDestroys.b).toHaveBeenCalled();
                expect(mockDestroys.d).toHaveBeenCalled();
                expect(mockDestroys.e).toHaveBeenCalled();
                expect(mockDestroys.a).not.toHaveBeenCalled();
                expect(mockDestroys.c).not.toHaveBeenCalled();
            });
        });
    }
);
