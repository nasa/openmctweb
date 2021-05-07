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

define([
    './plugins/plugins',
    'legacyRegistry',
    'utils/testing'
], function (plugins, legacyRegistry, testUtils) {
    describe("MCT", function () {
        let openmct;
        let mockPlugin;
        let mockPlugin2;
        let mockListener;
        let oldBundles;

        beforeEach(function () {
            mockPlugin = jasmine.createSpy('plugin');
            mockPlugin2 = jasmine.createSpy('plugin2');
            mockListener = jasmine.createSpy('listener');
            oldBundles = legacyRegistry.list();

            openmct = testUtils.createOpenMct();

            openmct.install(mockPlugin);
            openmct.install(mockPlugin2);
            openmct.on('start', mockListener);
        });

        // Clean up the dirty singleton.
        afterEach(function () {
            legacyRegistry.list().forEach(function (bundle) {
                if (oldBundles.indexOf(bundle) === -1) {
                    legacyRegistry.delete(bundle);
                }
            });

            return testUtils.resetApplicationState(openmct);
        });

        it("exposes plugins", function () {
            expect(openmct.plugins).toEqual(plugins);
        });

        it("does not issue a start event before started", function () {
            expect(mockListener).not.toHaveBeenCalled();
        });

        describe("start", function () {
            let appHolder;
            beforeEach(function (done) {
                appHolder = document.createElement("div");
                openmct.on('start', done);
                openmct.start(appHolder);
            });

            it("calls plugins for configuration", function () {
                expect(mockPlugin).toHaveBeenCalledWith(openmct);
                expect(mockPlugin2).toHaveBeenCalledWith(openmct);
            });

            it("emits a start event", function () {
                expect(mockListener).toHaveBeenCalled();
            });

            it("Renders the application into the provided container element", function () {
                let openMctShellElements = appHolder.querySelectorAll('div.l-shell');
                expect(openMctShellElements.length).toBe(1);
            });
        });

        describe("startHeadless", function () {
            beforeEach(function (done) {
                openmct.on('start', done);
                openmct.startHeadless();
            });

            it("calls plugins for configuration", function () {
                expect(mockPlugin).toHaveBeenCalledWith(openmct);
                expect(mockPlugin2).toHaveBeenCalledWith(openmct);
            });

            it("emits a start event", function () {
                expect(mockListener).toHaveBeenCalled();
            });

            it("Does not render Open MCT", function () {
                let openMctShellElements = document.body.querySelectorAll('div.l-shell');
                expect(openMctShellElements.length).toBe(0);
            });
        });

        describe("setAssetPath", function () {
            let testAssetPath;

            beforeEach(function () {
                openmct.legacyExtension = jasmine.createSpy('legacyExtension');
            });

            it("configures the path for assets", function () {
                testAssetPath = "some/path/";
                openmct.setAssetPath(testAssetPath);
                expect(openmct.getAssetPath()).toBe(testAssetPath);
            });

            it("adds a trailing /", function () {
                testAssetPath = "some/path";
                openmct.setAssetPath(testAssetPath);
                expect(openmct.getAssetPath()).toBe(testAssetPath + "/");
            });
        });
    });
});
