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
import FlexibleLayout from './plugin';

describe('the plugin', function () {
    let element;
    let child;
    let openmct;
    let flexibleLayoutDefinition;
    const testViewObject = {
        id: 'test-object',
        type: 'flexible-layout',
        configuration: {
            rowsLayout: false,
            containers: [
                {
                    'id': 'deb9f839-80ad-4ccf-a152-5c763ceb7d7e',
                    frames: [],
                    size: 50

                },
                {
                    'id': 'deb9f839-80ad-4ccf-a152-5c763ceb7d7f',
                    frames: [],
                    size: 50

                }
            ]
        },
        composition: []
    };

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(new FlexibleLayout());
        flexibleLayoutDefinition = openmct.types.get('flexible-layout');

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('defines a flexible layout object type with the correct key', () => {
        expect(flexibleLayoutDefinition.definition.name).toEqual('Flexible Layout');
    });

    describe('the view', function () {
        let flexibleLayoutViewProvider;

        beforeEach(() => {
            const applicableViews = openmct.objectViews.get(testViewObject, []);
            flexibleLayoutViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'flexible-layout');
        });

        it('provides a view', () => {
            expect(flexibleLayoutViewProvider).toBeDefined();
        });
    });

    describe('the toolbar', () => {
        let flexibleLayoutItem;
        let flexibleLayoutToolbar;
        let telemetryItem;
        let selection;

        beforeEach(() => {
            flexibleLayoutItem = {
                id: 'test-object',
                type: 'flexible-layout',
                configuration: {
                    rowsLayout: true,
                    containers: [
                        {
                            'id': 'deb9f839-80ad-4ccf-a152-5c763ceb7d7e',
                            frames: [{
                                id: "329bf482-d0dc-486a-aae0-6176276bd315",
                                'domainObjectIdentifier': {
                                    'namespace': '',
                                    'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                                },
                                size: 100,
                                noFrame: false
                            }],
                            size: 61

                        },
                        {
                            'id': 'deb9f839-80ad-4ccf-a152-5c763ceb7d7f',
                            frames: [{
                                id: "329bf482-d0dc-486a-aae0-6176276bd316",
                                'domainObjectIdentifier': {
                                    'namespace': '',
                                    'key': '55122607-e65e-44d5-9c9d-9c31a914ca90'
                                },
                                size: 100,
                                noFrame: false
                            }],
                            size: 39

                        }
                    ]
                },
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
            telemetryItem = {
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
                'persisted': 1592851063871,
                'id': '55122607-e65e-44d5-9c9d-9c31a914ca89',
                'identifier': {
                    'namespace': '',
                    'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                }
            };
            selection = [
                [{
                    context: {
                        frameId: "329bf482-d0dc-486a-aae0-6176276bd315",
                        item: telemetryItem,
                        type: "frame"
                    }
                },
                {
                    context: {
                        containerId: "deb9f839-80ad-4ccf-a152-5c763ceb7d7e",
                        'item': flexibleLayoutItem,
                        type: "container"
                    }
                },
                {
                    context: {
                        item: flexibleLayoutItem,
                        type: "flexible-layout"
                    }

                }]
            ];

            flexibleLayoutToolbar = openmct.toolbars.get(selection);
        });

        it('provides controls including separators', () => {
            expect(flexibleLayoutToolbar.length).toBe(6);
        });
    });
});
