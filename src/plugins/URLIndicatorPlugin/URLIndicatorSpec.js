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
    [
        "./URLIndicator",
        "./URLIndicatorPlugin",
        "../../MCT",
        "zepto"
    ],
    function (
        URLIndicator,
        URLIndicatorPlugin,
        MCT,
        $
    ) {
        const defaultAjaxFunction = $.ajax;

        describe("The URLIndicator", function () {
            let openmct;
            let indicatorElement;
            let pluginOptions;
            let ajaxOptions;
            let urlIndicator; // eslint-disable-line

            beforeEach(function () {
                jasmine.clock().install();
                openmct = new MCT();
                spyOn(openmct.indicators, 'add');
                spyOn($, 'ajax');
                $.ajax.and.callFake(function (options) {
                    ajaxOptions = options;
                });
            });

            afterEach(function () {
                $.ajax = defaultAjaxFunction;
                jasmine.clock().uninstall();
            });

            describe("on initialization", function () {
                describe("with default options", function () {
                    beforeEach(function () {
                        pluginOptions = {
                            url: "someURL"
                        };
                        urlIndicator = URLIndicatorPlugin(pluginOptions)(openmct);
                        indicatorElement = openmct.indicators.add.calls.mostRecent().args[0].element;
                    });

                    it("has a default icon class if none supplied", function () {
                        expect(indicatorElement.classList.contains('icon-chain-links')).toBe(true);
                    });

                    it("defaults to the URL if no label supplied", function () {
                        expect(indicatorElement.textContent.indexOf(pluginOptions.url) >= 0).toBe(true);
                    });
                });

                describe("with custom options", function () {
                    beforeEach(function () {
                        pluginOptions = {
                            url: "customURL",
                            interval: 1814,
                            iconClass: "iconClass-checked",
                            label: "custom label"
                        };
                        urlIndicator = URLIndicatorPlugin(pluginOptions)(openmct);
                        indicatorElement = openmct.indicators.add.calls.mostRecent().args[0].element;
                    });

                    it("uses the custom iconClass", function () {
                        expect(indicatorElement.classList.contains('iconClass-checked')).toBe(true);
                    });
                    it("uses custom interval", function () {
                        expect($.ajax.calls.count()).toEqual(1);
                        jasmine.clock().tick(1);
                        expect($.ajax.calls.count()).toEqual(1);
                        jasmine.clock().tick(pluginOptions.interval + 1);
                        expect($.ajax.calls.count()).toEqual(2);
                    });
                    it("uses custom label if supplied in initialization", function () {
                        expect(indicatorElement.textContent.indexOf(pluginOptions.label) >= 0).toBe(true);
                    });
                });
            });

            describe("when running", function () {
                beforeEach(function () {
                    pluginOptions = {
                        url: "someURL",
                        interval: 100
                    };
                    urlIndicator = URLIndicatorPlugin(pluginOptions)(openmct);
                    indicatorElement = openmct.indicators.add.calls.mostRecent().args[0].element;
                });

                it("requests the provided URL", function () {
                    jasmine.clock().tick(pluginOptions.interval + 1);
                    expect(ajaxOptions.url).toEqual(pluginOptions.url);
                });

                it("indicates success if connection is nominal", function () {
                    jasmine.clock().tick(pluginOptions.interval + 1);
                    ajaxOptions.success();
                    expect(indicatorElement.classList.contains('s-status-on')).toBe(true);
                });

                it("indicates an error when the server cannot be reached", function () {
                    jasmine.clock().tick(pluginOptions.interval + 1);
                    ajaxOptions.error();
                    expect(indicatorElement.classList.contains('s-status-warning-hi')).toBe(true);
                });
            });
        });
    }
);
