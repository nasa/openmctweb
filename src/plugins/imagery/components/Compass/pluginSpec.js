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
import Compass from './Compass.vue';
import Vue from 'vue';

const COMPASS_ROSE_CLASS = '.c-direction-rose';
const COMPASS_HUD_CLASS = '.c-compass__hud';

describe("The Compass component", () => {
    let app;
    let instance;

    beforeEach(() => {
        let imageDatum = {
            heading: 100,
            roll: 90,
            pitch: 90,
            cameraTilt: 100,
            cameraPan: 90,
            sunAngle: 30
        };
        let propsData = {
            containerWidth: 600,
            containerHeight: 600,
            naturalAspectRatio: 0.9,
            image: imageDatum
        };

        app = new Vue({
            components: { Compass },
            data() {
                return propsData;
            },
            template: `<Compass
                :container-width="containerWidth"
                :container-height="containerHeight"
                :natural-aspect-ratio="naturalAspectRatio"
                :image="image" />`
        });
        instance = app.$mount();

    });

    afterAll(() => {
        app.$destroy();
    });

    describe("when a heading value exists on the image", () => {

        it("should display a compass rose", () => {
            let compassRoseElement = instance.$el.querySelector(COMPASS_ROSE_CLASS
            );

            expect(compassRoseElement).toBeDefined();
        });

        it("should display a compass HUD", () => {
            let compassHUDElement = instance.$el.querySelector(COMPASS_HUD_CLASS);

            expect(compassHUDElement).toBeDefined();
        });

    });

});
