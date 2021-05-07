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
import PerformancePlugin from './plugin.js';
import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

describe('the plugin', () => {
    let openmct;
    let element;
    let child;

    let performanceIndicator;
    let countFramesPromise;

    beforeEach((done) => {
        openmct = createOpenMct(false);

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.install(new PerformancePlugin());

        countFramesPromise = countFrames();

        openmct.on('start', done);

        performanceIndicator = openmct.indicators.indicatorObjects.find((indicator) => {
            return indicator.text && indicator.text() === '~ fps';
        });

        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('installs the performance indicator', () => {
        expect(performanceIndicator).toBeDefined();
    });

    it('correctly calculates fps', () => {
        return countFramesPromise.then((frames) => {
            expect(performanceIndicator.text()).toEqual(`${frames} fps`);
        });
    });

    function countFrames() {
        let startTime = performance.now();
        let frames = 0;

        return new Promise((resolve) => {
            requestAnimationFrame(function incrementCount() {
                let now = performance.now();

                if ((now - startTime) < 1000) {
                    frames++;
                    requestAnimationFrame(incrementCount);
                } else {
                    resolve(frames);
                }
            });
        });
    }
});
