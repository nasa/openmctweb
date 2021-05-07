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

import {createOpenMct, resetApplicationState} from "utils/testing";
import PlanPlugin from "../plan/plugin";
import Vue from 'vue';

describe('the plugin', function () {
    let planDefinition;
    let element;
    let child;
    let openmct;

    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(new PlanPlugin());

        planDefinition = openmct.types.get('plan').definition;

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        openmct.time.timeSystem('utc', {
            start: 1597160002854,
            end: 1597181232854
        });
        openmct.on('start', done);
        openmct.start(appHolder);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    let mockPlanObject = {
        name: 'Plan',
        key: 'plan',
        creatable: true
    };

    it('defines a plan object type with the correct key', () => {
        expect(planDefinition.key).toEqual(mockPlanObject.key);
    });

    it('is creatable', () => {
        expect(planDefinition.creatable).toEqual(mockPlanObject.creatable);
    });

    describe('the plan view', () => {

        it('provides a plan view', () => {
            const testViewObject = {
                id: "test-object",
                type: "plan"
            };

            const applicableViews = openmct.objectViews.get(testViewObject, []);
            let planView = applicableViews.find((viewProvider) => viewProvider.key === 'plan.view');
            expect(planView).toBeDefined();
        });

    });

    describe('the plan view displays activities', () => {
        let planDomainObject;
        let mockObjectPath = [
            {
                identifier: {
                    key: 'test',
                    namespace: ''
                },
                type: 'time-strip',
                name: 'Test Parent Object'
            }
        ];
        let planView;

        beforeEach((done) => {
            planDomainObject = {
                identifier: {
                    key: 'test-object',
                    namespace: ''
                },
                type: 'plan',
                id: "test-object",
                selectFile: {
                    body: JSON.stringify({
                        "TEST-GROUP": [
                            {
                                "name": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
                                "start": 1597170002854,
                                "end": 1597171032854,
                                "type": "TEST-GROUP",
                                "color": "fuchsia",
                                "textColor": "black"
                            },
                            {
                                "name": "Sed ut perspiciatis",
                                "start": 1597171132854,
                                "end": 1597171232854,
                                "type": "TEST-GROUP",
                                "color": "fuchsia",
                                "textColor": "black"
                            }
                        ]
                    })
                }
            };

            const applicableViews = openmct.objectViews.get(planDomainObject, []);
            planView = applicableViews.find((viewProvider) => viewProvider.key === 'plan.view');
            let view = planView.view(planDomainObject, mockObjectPath);
            view.show(child, true);

            return Vue.nextTick().then(() => {
                done();
            });
        });

        it('loads activities into the view', () => {
            const svgEls = element.querySelectorAll('.c-plan__contents svg');
            expect(svgEls.length).toEqual(1);
        });

        it('displays the group label', () => {
            const labelEl = element.querySelector('.c-plan__contents .c-object-label .c-object-label__name');
            expect(labelEl.innerHTML).toEqual('TEST-GROUP');
        });

        it('displays the activities and their labels', () => {
            const rectEls = element.querySelectorAll('.c-plan__contents rect');
            expect(rectEls.length).toEqual(2);
            const textEls = element.querySelectorAll('.c-plan__contents text');
            expect(textEls.length).toEqual(3);
        });
    });

});
