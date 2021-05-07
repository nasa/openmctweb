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

import { createOpenMct, resetApplicationState } from "utils/testing";
import TimelinePlugin from "./plugin";
import Vue from 'vue';

describe('the plugin', function () {
    let objectDef;
    let element;
    let child;
    let openmct;
    let mockObjectPath;

    beforeEach((done) => {
        mockObjectPath = [
            {
                name: 'mock folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            },
            {
                name: 'mock parent folder',
                type: 'time-strip',
                identifier: {
                    key: 'mock-parent-folder',
                    namespace: ''
                }
            }
        ];
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(new TimelinePlugin());

        objectDef = openmct.types.get('time-strip').definition;

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
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    let mockObject = {
        name: 'Time Strip',
        key: 'time-strip',
        creatable: true
    };

    it('defines a time-strip object type with the correct key', () => {
        expect(objectDef.key).toEqual(mockObject.key);
    });

    describe('the time-strip object', () => {

        it('is creatable', () => {
            expect(objectDef.creatable).toEqual(mockObject.creatable);
        });
    });

    describe('the view', () => {
        let timelineView;

        beforeEach((done) => {
            const testViewObject = {
                id: "test-object",
                type: "time-strip"
            };

            const applicableViews = openmct.objectViews.get(testViewObject, mockObjectPath);
            timelineView = applicableViews.find((viewProvider) => viewProvider.key === 'time-strip.view');
            let view = timelineView.view(testViewObject, element);
            view.show(child, true);
            Vue.nextTick(done);
        });

        it('provides a view', () => {
            expect(timelineView).toBeDefined();
        });

        it('displays a time axis', () => {
            const el = element.querySelector('.c-timesystem-axis');
            expect(el).toBeDefined();
        });
    });

});
