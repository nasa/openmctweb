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
    ["../src/AgentService"],
    function (AgentService) {

        var TEST_USER_AGENTS = {
            DESKTOP: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36",
            IPAD: "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53",
            IPHONE: "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53"
        };

        describe("The AgentService", function () {
            var testWindow, agentService;

            beforeEach(function () {
                testWindow = {
                    innerWidth: 640,
                    innerHeight: 480,
                    navigator: {
                        userAgent: TEST_USER_AGENTS.DESKTOP
                    }
                };
            });

            it("recognizes desktop devices as non-mobile", function () {
                testWindow.navigator.userAgent = TEST_USER_AGENTS.DESKTOP;
                agentService = new AgentService(testWindow);
                expect(agentService.isMobile()).toBeFalsy();
                expect(agentService.isPhone()).toBeFalsy();
                expect(agentService.isTablet()).toBeFalsy();
            });

            it("detects iPhones", function () {
                testWindow.navigator.userAgent = TEST_USER_AGENTS.IPHONE;
                agentService = new AgentService(testWindow);
                expect(agentService.isMobile()).toBeTruthy();
                expect(agentService.isPhone()).toBeTruthy();
                expect(agentService.isTablet()).toBeFalsy();
            });

            it("detects iPads", function () {
                testWindow.navigator.userAgent = TEST_USER_AGENTS.IPAD;
                agentService = new AgentService(testWindow);
                expect(agentService.isMobile()).toBeTruthy();
                expect(agentService.isPhone()).toBeFalsy();
                expect(agentService.isTablet()).toBeTruthy();
            });

            it("detects display orientation", function () {
                agentService = new AgentService(testWindow);
                testWindow.innerWidth = 1024;
                testWindow.innerHeight = 400;
                expect(agentService.isPortrait()).toBeFalsy();
                expect(agentService.isLandscape()).toBeTruthy();
                testWindow.innerWidth = 400;
                testWindow.innerHeight = 1024;
                expect(agentService.isPortrait()).toBeTruthy();
                expect(agentService.isLandscape()).toBeFalsy();
            });

            it("detects touch support", function () {
                testWindow.ontouchstart = null;
                expect(new AgentService(testWindow).isTouch())
                    .toBe(true);
                delete testWindow.ontouchstart;
                expect(new AgentService(testWindow).isTouch())
                    .toBe(false);
            });

            it("allows for checking browser type", function () {
                testWindow.navigator.userAgent = "Chromezilla Safarifox";
                agentService = new AgentService(testWindow);
                expect(agentService.isBrowser("Chrome")).toBe(true);
                expect(agentService.isBrowser("Firefox")).toBe(false);
            });
        });
    }
);
