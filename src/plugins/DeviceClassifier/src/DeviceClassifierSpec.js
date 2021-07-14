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
import DeviceClassifier from "./DeviceClassifier";
import DeviceMatchers from "./DeviceMatchers";

const AGENT_SERVICE_METHODS = [
    "isMobile",
    "isPhone",
    "isTablet",
    "isPortrait",
    "isLandscape",
    "isTouch"
];
const TEST_PERMUTATIONS = [
    ["isMobile", "isPhone", "isTouch", "isPortrait"],
    ["isMobile", "isPhone", "isTouch", "isLandscape"],
    ["isMobile", "isTablet", "isTouch", "isPortrait"],
    ["isMobile", "isTablet", "isTouch", "isLandscape"],
    ["isTouch"],
    []
];

describe("DeviceClassifier", function () {
    let mockAgentService;
    let mockDocument;
    let mockClassList;

    beforeEach(function () {
        mockAgentService = jasmine.createSpyObj(
            "agentService",
            AGENT_SERVICE_METHODS
        );

        mockClassList = jasmine.createSpyObj("classList", ["add"]);

        mockDocument = jasmine.createSpyObj(
            "document",
            {},
            { body: { classList: mockClassList } }
        );

        AGENT_SERVICE_METHODS.forEach(function (m) {
            mockAgentService[m].and.returnValue(false);
        });
    });

    TEST_PERMUTATIONS.forEach(function (trueMethods) {
        const summary =
      trueMethods.length === 0
          ? "device has no detected characteristics"
          : "device " + trueMethods.join(", ");

        describe("when " + summary, function () {
            beforeEach(function () {
                trueMethods.forEach(function (m) {
                    mockAgentService[m].and.returnValue(true);
                });

                // eslint-disable-next-line no-new
                DeviceClassifier(mockAgentService, mockDocument);
            });

            it("adds classes for matching, detected characteristics", function () {
                Object.keys(DeviceMatchers)
                    .filter(function (m) {
                        return DeviceMatchers[m](mockAgentService);
                    })
                    .forEach(function (key) {
                        expect(mockDocument.body.classList.add).toHaveBeenCalledWith(key);
                    });
            });

            it("does not add classes for non-matching characteristics", function () {
                Object.keys(DeviceMatchers)
                    .filter(function (m) {
                        return !DeviceMatchers[m](mockAgentService);
                    })
                    .forEach(function (key) {
                        expect(mockDocument.body.classList.add).not.toHaveBeenCalledWith(
                            key
                        );
                    });
            });
        });
    });
});
