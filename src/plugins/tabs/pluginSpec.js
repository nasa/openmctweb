/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { createOpenMct, resetApplicationState } from 'utils/testing';
import TabsLayout from './plugin';
import Vue from "vue";
import EventEmitter from "EventEmitter";

describe('the plugin', function () {
    let element;
    let child;
    let openmct;
    let tabsLayoutDefinition;
    const testViewObject = {
        id: 'af3f0e11-354e-48b5-9887-de47dfb6ecf6',
        identifier: {
            key: 'af3f0e11-354e-48b5-9887-de47dfb6ecf6',
            namespace: ''
        },
        type: 'tabs',
        name: 'Tabs view',
        keep_alive: true,
        composition: [
            {
                'identifier': {
                    'namespace': '',
                    'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                }
            },
            {
                'identifier': {
                    'namespace': '',
                    'key': '55122607-e65e-44d5-9c9d-9c31a914ca90'
                }
            }
        ]
    };
    const telemetryItemTemplate = {
        'telemetry': {
            'period': 5,
            'amplitude': 5,
            'offset': 5,
            'dataRateInHz': 5,
            'phase': 5,
            'randomness': 0
        },
        'name': 'Sine Wave Generator',
        'type': 'generator',
        'modified': 1592851063871,
        'location': 'mine',
        'persisted': 1592851063871
    };
    let telemetryItem1 = Object.assign({}, telemetryItemTemplate, {
        'id': '55122607-e65e-44d5-9c9d-9c31a914ca89',
        'identifier': {
            'namespace': '',
            'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
        }
    });
    let telemetryItem2 = Object.assign({}, telemetryItemTemplate, {
        'id': '55122607-e65e-44d5-9c9d-9c31a914ca90',
        'identifier': {
            'namespace': '',
            'key': '55122607-e65e-44d5-9c9d-9c31a914ca90'
        }
    });

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(new TabsLayout());
        tabsLayoutDefinition = openmct.types.get('tabs');

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('defines a tabs object type with the correct key', () => {
        expect(tabsLayoutDefinition.definition.name).toEqual('Tabs View');
    });

    it('is creatable', () => {
        expect(tabsLayoutDefinition.definition.creatable).toEqual(true);
    });

    describe('the view', function () {
        let tabsLayoutViewProvider;
        let mockComposition;

        beforeEach((done) => {
            mockComposition = new EventEmitter();
            mockComposition.load = () => {
                return Promise.resolve([telemetryItem1]);
            };

            spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

            const applicableViews = openmct.objectViews.get(testViewObject, []);
            tabsLayoutViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'tabs');
            let view = tabsLayoutViewProvider.view(testViewObject, []);
            view.show(child, true);
            Vue.nextTick(done);
        });

        it('provides a view', () => {
            expect(tabsLayoutViewProvider).toBeDefined();
        });

        it('renders tab element', () => {
            const tabsElements = element.querySelectorAll('.c-tabs');

            expect(tabsElements.length).toBe(1);
        });

        it('renders empty tab element with msg', () => {
            const tabsElement = element.querySelector('.c-tabs');

            expect(tabsElement.innerText.trim()).toEqual('Drag objects here to add them to this view.');
        });
    });

    describe('the view', function () {
        let tabsLayoutViewProvider;
        let mockComposition;
        let count = 0;

        beforeEach((done) => {
            mockComposition = new EventEmitter();
            mockComposition.load = () => {
                if (count === 0) {
                    mockComposition.emit('add', telemetryItem1);
                    mockComposition.emit('add', telemetryItem2);
                    count++;
                }

                return Promise.resolve([telemetryItem1, telemetryItem2]);
            };

            spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

            const applicableViews = openmct.objectViews.get(testViewObject, []);
            tabsLayoutViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'tabs');
            let view = tabsLayoutViewProvider.view(testViewObject, []);
            view.show(child, true);
            Vue.nextTick(done);
        });

        it ('renders a tab for each item', () => {
            let tabEls = element.querySelectorAll('.js-tab');
            expect(tabEls.length).toEqual(2);
        });
    });
});
