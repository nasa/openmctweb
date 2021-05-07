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
    ["../src/DeviceMatchers"],
    function (DeviceMatchers) {

        describe("DeviceMatchers", function () {
            var mockAgentService;

            beforeEach(function () {
                mockAgentService = jasmine.createSpyObj(
                    'agentService',
                    [
                        'isMobile',
                        'isPhone',
                        'isTablet',
                        'isPortrait',
                        'isLandscape',
                        'isTouch'
                    ]
                );
            });

            it("detects when a device is a desktop device", function () {
                mockAgentService.isMobile.and.returnValue(false);
                expect(DeviceMatchers.desktop(mockAgentService))
                    .toBe(true);
                mockAgentService.isMobile.and.returnValue(true);
                expect(DeviceMatchers.desktop(mockAgentService))
                    .toBe(false);
            });

            function method(deviceType) {
                return "is" + deviceType[0].toUpperCase() + deviceType.slice(1);
            }

            [
                "mobile",
                "phone",
                "tablet",
                "landscape",
                "portrait",
                "landscape",
                "touch"
            ].forEach(function (deviceType) {
                it("detects when a device is a " + deviceType + " device", function () {
                    mockAgentService[method(deviceType)].and.returnValue(true);
                    expect(DeviceMatchers[deviceType](mockAgentService))
                        .toBe(true);
                    mockAgentService[method(deviceType)].and.returnValue(false);
                    expect(DeviceMatchers[deviceType](mockAgentService))
                        .toBe(false);
                });
            });

        });
    }
);
