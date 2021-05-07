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
import DisplayLayoutPlugin from './plugin';

describe('the plugin', function () {
    let element;
    let child;
    let openmct;
    let displayLayoutDefinition;

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(new DisplayLayoutPlugin({
            showAsView: []
        }));
        displayLayoutDefinition = openmct.types.get('layout');

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('defines a display layout object type with the correct key', () => {
        expect(displayLayoutDefinition.definition.name).toEqual('Display Layout');
    });

    it('provides a view', () => {
        const testViewObject = {
            id: 'test-object',
            type: 'layout',
            configuration: {
                items: [
                    {

                        'identifier': {
                            'namespace': '',
                            'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                        },
                        'x': 8,
                        'y': 3,
                        'width': 10,
                        'height': 5,
                        'displayMode': 'all',
                        'value': 'sin',
                        'stroke': '',
                        'fill': '',
                        'color': '',
                        'size': '13px',
                        'type': 'telemetry-view',
                        'id': 'deb9f839-80ad-4ccf-a152-5c763ceb7d7e'

                    }
                ],
                layoutGrid: [10, 10]
            }
        };

        const applicableViews = openmct.objectViews.get(testViewObject, []);
        let displayLayoutViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'layout.view');
        expect(displayLayoutViewProvider).toBeDefined();
    });

    describe('the alpha numeric format view', () => {
        let displayLayoutItem;
        let telemetryItem;
        let selection;

        beforeEach(() => {
            displayLayoutItem = {
                'composition': [
                ],
                'configuration': {
                    'items': [
                        {

                            'identifier': {
                                'namespace': '',
                                'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                            },
                            'x': 8,
                            'y': 3,
                            'width': 10,
                            'height': 5,
                            'displayMode': 'all',
                            'value': 'sin',
                            'stroke': '',
                            'fill': '',
                            'color': '',
                            'size': '13px',
                            'type': 'telemetry-view',
                            'id': 'deb9f839-80ad-4ccf-a152-5c763ceb7d7e'

                        }
                    ],
                    'layoutGrid': [
                        10,
                        10
                    ]
                },
                'name': 'Display Layout',
                'type': 'layout',
                'identifier': {
                    'namespace': '',
                    'key': 'c5e636c1-6771-4c9c-b933-8665cab189b3'
                }
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
                        'layoutItem': displayLayoutItem.configuration.items[0],
                        'item': telemetryItem,
                        'index': 1
                    }
                },
                {
                    context: {
                        'item': displayLayoutItem,
                        'supportsMultiSelect': true
                    }
                }]
            ];
        });

        it('provides an alphanumeric format view', () => {
            const displayLayoutAlphaNumFormatView = openmct.inspectorViews.get(selection);
            expect(displayLayoutAlphaNumFormatView.length).toBeDefined();
        });
    });

    describe('the toolbar', () => {
        let displayLayoutItem;
        let selection;

        beforeEach(() => {
            displayLayoutItem = {
                'composition': [
                ],
                'configuration': {
                    'items': [
                        {
                            'fill': '#717171',
                            'stroke': '',
                            'x': 1,
                            'y': 1,
                            'width': 10,
                            'height': 5,
                            'type': 'box-view',
                            'id': '89b88746-d325-487b-aec4-11b79afff9e8'
                        },
                        {
                            'x': 18,
                            'y': 9,
                            'x2': 23,
                            'y2': 4,
                            'stroke': '#717171',
                            'type': 'line-view',
                            'id': '57d49a28-7863-43bd-9593-6570758916f0'
                        },
                        {

                            'identifier': {
                                'namespace': '',
                                'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                            },
                            'x': 8,
                            'y': 3,
                            'width': 10,
                            'height': 5,
                            'displayMode': 'all',
                            'value': 'sin',
                            'stroke': '',
                            'fill': '',
                            'color': '',
                            'size': '13px',
                            'type': 'telemetry-view',
                            'id': 'deb9f839-80ad-4ccf-a152-5c763ceb7d7e'

                        },
                        {

                            'width': 32,
                            'height': 18,
                            'x': 78,
                            'y': 8,
                            'identifier': {
                                'namespace': '',
                                'key': 'bdeb91ab-3a7e-4a71-9dd2-39d73644e136'
                            },
                            'hasFrame': true,
                            'type': 'subobject-view',
                            'id': 'c0ff485a-344c-4e70-8d83-a9d9998a69fc'

                        }
                    ],
                    'layoutGrid': [
                        10,
                        10
                    ]
                },
                'name': 'Display Layout',
                'type': 'layout',
                'identifier': {
                    'namespace': '',
                    'key': 'c5e636c1-6771-4c9c-b933-8665cab189b3'
                }
            };
            selection = [
                [{
                    context: {
                        'layoutItem': displayLayoutItem.configuration.items[1],
                        'index': 1
                    }
                },
                {
                    context: {
                        'item': displayLayoutItem,
                        'supportsMultiSelect': true
                    }
                }],
                [{
                    context: {
                        'layoutItem': displayLayoutItem.configuration.items[0],
                        'index': 0
                    }
                },
                {
                    context: {
                        item: displayLayoutItem,
                        'supportsMultiSelect': true
                    }
                }],
                [{
                    context: {
                        'layoutItem': displayLayoutItem.configuration.items[2],
                        'item': displayLayoutItem.configuration.items[2],
                        'index': 2
                    }
                },
                {
                    context: {
                        item: displayLayoutItem,
                        'supportsMultiSelect': true
                    }
                }],
                [{
                    context: {
                        'item': {

                            'composition': [
                                {
                                    'namespace': '',
                                    'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                                }
                            ],
                            'configuration': {
                                'series': [
                                    {
                                        'identifier': {
                                            'namespace': '',
                                            'key': '55122607-e65e-44d5-9c9d-9c31a914ca89'
                                        }
                                    }
                                ],
                                'yAxis': {
                                },
                                'xAxis': {
                                }
                            },
                            'name': 'Unnamed Overlay Plot',
                            'type': 'telemetry.plot.overlay',
                            'modified': 1594142141929,
                            'location': 'mine',
                            'identifier': {
                                'namespace': '',
                                'key': 'bdeb91ab-3a7e-4a71-9dd2-39d73644e136'
                            },
                            'persisted': 1594142141929

                        },
                        'layoutItem': displayLayoutItem.configuration.items[3],
                        'index': 3
                    }
                },
                {
                    context: {
                        item: displayLayoutItem,
                        'supportsMultiSelect': true
                    }
                }]
            ];
        });

        it('provides controls including separators', () => {
            const displayLayoutToolbar = openmct.toolbars.get(selection);

            expect(displayLayoutToolbar.length).toBe(9);
        });
    });
});
