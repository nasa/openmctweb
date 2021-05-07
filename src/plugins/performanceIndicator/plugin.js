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
export default function PerformanceIndicator() {
    return function install(openmct) {
        let frames = 0;
        let lastCalculated = performance.now();
        const indicator = openmct.indicators.simpleIndicator();

        indicator.text('~ fps');
        indicator.statusClass('s-status-info');
        openmct.indicators.add(indicator);

        let rafHandle = requestAnimationFrame(incremementFrames);

        openmct.on('destroy', () => {
            cancelAnimationFrame(rafHandle);
        });

        function incremementFrames() {
            let now = performance.now();
            if ((now - lastCalculated) < 1000) {
                frames++;
            } else {
                updateFPS(frames);
                lastCalculated = now;
                frames = 1;
            }

            rafHandle = requestAnimationFrame(incremementFrames);
        }

        function updateFPS(fps) {
            indicator.text(`${fps} fps`);
            if (fps >= 40) {
                indicator.statusClass('s-status-on');
            } else if (fps < 40 && fps >= 20) {
                indicator.statusClass('s-status-warning');
            } else {
                indicator.statusClass('s-status-error');
            }
        }
    };
}
