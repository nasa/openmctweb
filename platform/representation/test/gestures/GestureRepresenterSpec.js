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
    ["../../src/gestures/GestureRepresenter"],
    function (GestureRepresenter) {

        describe("A gesture representer", function () {
            var mockGestureService,
                mockGestureHandle,
                mockElement,
                representer;

            beforeEach(function () {
                mockGestureService = jasmine.createSpyObj(
                    "gestureService",
                    ["attachGestures"]
                );
                mockGestureHandle = jasmine.createSpyObj(
                    "gestureHandle",
                    ["destroy"]
                );

                mockElement = { someKey: "some value" };

                mockGestureService.attachGestures.and.returnValue(mockGestureHandle);

                representer = new GestureRepresenter(
                    mockGestureService,
                    undefined, // Scope is not used
                    mockElement
                );
            });

            it("attaches declared gestures, and detaches on request", function () {
                // Pass in some objects, which we expect to be passed into the
                // gesture service accordingly.
                var domainObject = { someOtherKey: "some other value" },
                    representation = { gestures: ["a", "b", "c"] };

                representer.represent(representation, domainObject);

                expect(mockGestureService.attachGestures).toHaveBeenCalledWith(
                    mockElement,
                    domainObject,
                    ["a", "b", "c"]
                );

                // Should not have been destroyed yet...
                expect(mockGestureHandle.destroy).not.toHaveBeenCalled();

                // Destroy
                representer.destroy();

                // Should have destroyed those old gestures
                expect(mockGestureHandle.destroy).toHaveBeenCalled();
            });

        });
    }
);
