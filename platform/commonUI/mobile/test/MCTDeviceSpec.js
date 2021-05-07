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
    ['../src/MCTDevice'],
    function (MCTDevice) {

        var JQLITE_METHODS = ['replaceWith'];

        describe("The mct-device directive", function () {
            var mockAgentService,
                mockTransclude,
                mockElement,
                mockClone,
                testAttrs,
                directive;

            function link() {
                directive.link(null, mockElement, testAttrs, null, mockTransclude);
            }

            beforeEach(function () {
                mockAgentService = jasmine.createSpyObj(
                    "agentService",
                    ["isMobile", "isPhone", "isTablet", "isPortrait", "isLandscape"]
                );
                mockTransclude = jasmine.createSpy("$transclude");
                mockElement = jasmine.createSpyObj(name, JQLITE_METHODS);
                mockClone = jasmine.createSpyObj(name, JQLITE_METHODS);

                mockTransclude.and.callFake(function (fn) {
                    fn(mockClone);
                });

                // Look desktop-like by default
                mockAgentService.isLandscape.and.returnValue(true);

                testAttrs = {};

                directive = new MCTDevice(mockAgentService);
            });

            function expectInclusion() {
                expect(mockElement.replaceWith)
                    .toHaveBeenCalledWith(mockClone);
            }

            function expectExclusion() {
                expect(mockElement.replaceWith).not.toHaveBeenCalled();
            }

            it("is applicable at the attribute level", function () {
                expect(directive.restrict).toEqual("A");
            });

            it("transcludes at the element level", function () {
                expect(directive.transclude).toEqual('element');
            });

            it("has a greater priority number than ng-if", function () {
                expect(directive.priority > 600).toBeTruthy();
            });

            it("restricts element inclusion for mobile devices", function () {
                testAttrs.mctDevice = "mobile";
                link();
                expectExclusion();

                mockAgentService.isMobile.and.returnValue(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for tablet devices", function () {
                testAttrs.mctDevice = "tablet";
                mockAgentService.isMobile.and.returnValue(true);
                link();
                expectExclusion();

                mockAgentService.isTablet.and.returnValue(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for phone devices", function () {
                testAttrs.mctDevice = "phone";
                mockAgentService.isMobile.and.returnValue(true);
                link();
                expectExclusion();

                mockAgentService.isPhone.and.returnValue(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for desktop devices", function () {
                testAttrs.mctDevice = "desktop";
                mockAgentService.isMobile.and.returnValue(true);
                link();
                expectExclusion();

                mockAgentService.isMobile.and.returnValue(false);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for portrait orientation", function () {
                testAttrs.mctDevice = "portrait";
                link();
                expectExclusion();

                mockAgentService.isPortrait.and.returnValue(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for landscape orientation", function () {
                testAttrs.mctDevice = "landscape";
                mockAgentService.isLandscape.and.returnValue(false);
                mockAgentService.isPortrait.and.returnValue(true);
                link();
                expectExclusion();

                mockAgentService.isLandscape.and.returnValue(true);
                link();
                expectInclusion();
            });

            it("allows multiple device characteristics to be requested", function () {
                // Won't try to test every permutation here, just
                // make sure the multi-characteristic feature has support.
                testAttrs.mctDevice = "portrait mobile";
                link();
                // Neither portrait nor mobile, not called
                expectExclusion();

                mockAgentService.isPortrait.and.returnValue(true);
                link();

                // Was portrait, but not mobile, so no
                expectExclusion();

                mockAgentService.isMobile.and.returnValue(true);
                link();
                expectInclusion();
            });
        });
    }
);
