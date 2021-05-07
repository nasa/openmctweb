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
    ["../src/DeviceClassifier", "../src/DeviceMatchers"],
    function (DeviceClassifier, DeviceMatchers) {

        var AGENT_SERVICE_METHODS = [
                'isMobile',
                'isPhone',
                'isTablet',
                'isPortrait',
                'isLandscape',
                'isTouch'
            ],
            TEST_PERMUTATIONS = [
                ['isMobile', 'isPhone', 'isTouch', 'isPortrait'],
                ['isMobile', 'isPhone', 'isTouch', 'isLandscape'],
                ['isMobile', 'isTablet', 'isTouch', 'isPortrait'],
                ['isMobile', 'isTablet', 'isTouch', 'isLandscape'],
                ['isTouch'],
                []
            ];

        describe("DeviceClassifier", function () {
            var mockAgentService,
                mockDocument,
                mockBody;

            beforeEach(function () {
                mockAgentService = jasmine.createSpyObj(
                    'agentService',
                    AGENT_SERVICE_METHODS
                );
                mockDocument = jasmine.createSpyObj(
                    '$document',
                    ['find']
                );
                mockBody = jasmine.createSpyObj(
                    'body',
                    ['addClass']
                );
                mockDocument.find.and.callFake(function (sel) {
                    return sel === 'body' && mockBody;
                });
                AGENT_SERVICE_METHODS.forEach(function (m) {
                    mockAgentService[m].and.returnValue(false);
                });
            });

            TEST_PERMUTATIONS.forEach(function (trueMethods) {
                var summary = trueMethods.length === 0
                    ? "device has no detected characteristics"
                    : "device " + (trueMethods.join(", "));

                describe("when " + summary, function () {
                    var classifier; // eslint-disable-line

                    beforeEach(function () {
                        trueMethods.forEach(function (m) {
                            mockAgentService[m].and.returnValue(true);
                        });
                        classifier = new DeviceClassifier(
                            mockAgentService,
                            mockDocument
                        );
                    });

                    it("adds classes for matching, detected characteristics", function () {
                        Object.keys(DeviceMatchers).filter(function (m) {
                            return DeviceMatchers[m](mockAgentService);
                        }).forEach(function (key) {
                            expect(mockBody.addClass)
                                .toHaveBeenCalledWith(key);
                        });
                    });

                    it("does not add classes for non-matching characteristics", function () {
                        Object.keys(DeviceMatchers).filter(function (m) {
                            return !DeviceMatchers[m](mockAgentService);
                        }).forEach(function (key) {
                            expect(mockBody.addClass)
                                .not.toHaveBeenCalledWith(key);
                        });
                    });
                });
            });
        });
    }
);
