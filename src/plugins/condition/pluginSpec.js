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
import ConditionPlugin from "./plugin";
import stylesManager from '@/ui/inspector/styles/StylesManager';
import StylesView from "./components/inspector/StylesView.vue";
import Vue from 'vue';
import {getApplicableStylesForItem} from "./utils/styleUtils";
import ConditionManager from "@/plugins/condition/ConditionManager";

describe('the plugin', function () {
    let conditionSetDefinition;
    let mockConditionSetDomainObject;
    let mockListener;
    let element;
    let child;
    let openmct;
    let testTelemetryObject;

    beforeEach((done) => {
        testTelemetryObject = {
            identifier: {
                namespace: "",
                key: "test-object"
            },
            type: "test-object",
            name: "Test Object",
            telemetry: {
                values: [{
                    key: "some-key2",
                    source: "some-key2",
                    name: "Some attribute",
                    hints: {
                        range: 2
                    }
                },
                {
                    key: "utc",
                    name: "Time",
                    format: "utc",
                    hints: {
                        domain: 1
                    }
                }, {
                    key: "testSource",
                    source: "value",
                    name: "Test",
                    format: "string"
                },
                {
                    key: "some-key",
                    source: "some-key",
                    hints: {
                        domain: 1
                    }
                }]
            }
        };

        openmct = createOpenMct();
        openmct.install(new ConditionPlugin());

        conditionSetDefinition = openmct.types.get('conditionSet').definition;

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        mockConditionSetDomainObject = {
            identifier: {
                key: 'testConditionSetKey',
                namespace: ''
            },
            type: 'conditionSet'
        };

        mockListener = jasmine.createSpy('mockListener');

        conditionSetDefinition.initialize(mockConditionSetDomainObject);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    let mockConditionSetObject = {
        name: 'Condition Set',
        key: 'conditionSet',
        creatable: true
    };

    it('defines a conditionSet object type with the correct key', () => {
        expect(conditionSetDefinition.key).toEqual(mockConditionSetObject.key);
    });

    describe('the conditionSet object', () => {

        it('is creatable', () => {
            expect(conditionSetDefinition.creatable).toEqual(mockConditionSetObject.creatable);
        });

        it('initializes with an empty composition list', () => {
            expect(mockConditionSetDomainObject.composition instanceof Array).toBeTrue();
            expect(mockConditionSetDomainObject.composition.length).toEqual(0);
        });

        it('provides a view', () => {
            const testViewObject = {
                id: "test-object",
                type: "conditionSet",
                configuration: {
                    conditionCollection: []
                }
            };

            const applicableViews = openmct.objectViews.get(testViewObject, []);
            let conditionSetView = applicableViews.find((viewProvider) => viewProvider.key === 'conditionSet.view');
            expect(conditionSetView).toBeDefined();
        });

    });

    describe('the condition set usage for multiple display layout items', () => {
        let displayLayoutItem;
        let lineLayoutItem;
        let boxLayoutItem;
        let notCreatableObjectItem;
        let notCreatableObject;
        let selection;
        let component;
        let styleViewComponentObject;
        const conditionSetDomainObject = {
            "configuration": {
                "conditionTestData": [
                    {
                        "telemetry": "",
                        "metadata": "",
                        "input": ""
                    }
                ],
                "conditionCollection": [
                    {
                        "id": "39584410-cbf9-499e-96dc-76f27e69885d",
                        "configuration": {
                            "name": "Unnamed Condition",
                            "output": "Sine > 0",
                            "trigger": "all",
                            "criteria": [
                                {
                                    "id": "85fbb2f7-7595-42bd-9767-a932266c5225",
                                    "telemetry": {
                                        "namespace": "",
                                        "key": "be0ba97f-b510-4f40-a18d-4ff121d5ea1a"
                                    },
                                    "operation": "greaterThan",
                                    "input": [
                                        "0"
                                    ],
                                    "metadata": "sin"
                                },
                                {
                                    "id": "35400132-63b0-425c-ac30-8197df7d5862",
                                    "telemetry": "any",
                                    "operation": "enumValueIs",
                                    "input": [
                                        "0"
                                    ],
                                    "metadata": "state"
                                }
                            ]
                        },
                        "summary": "Match if all criteria are met: Sine Wave Generator Sine > 0 and any telemetry State is OFF "
                    },
                    {
                        "isDefault": true,
                        "id": "2532d90a-e0d6-4935-b546-3123522da2de",
                        "configuration": {
                            "name": "Default",
                            "output": "Default",
                            "trigger": "all",
                            "criteria": [
                            ]
                        },
                        "summary": ""
                    }
                ]
            },
            "composition": [
                {
                    "namespace": "",
                    "key": "be0ba97f-b510-4f40-a18d-4ff121d5ea1a"
                },
                {
                    "namespace": "",
                    "key": "077ffa67-e78f-4e99-80e0-522ac33a3888"
                }
            ],
            "telemetry": {
            },
            "name": "Condition Set",
            "type": "conditionSet",
            "identifier": {
                "namespace": "",
                "key": "863012c1-f6ca-4ab0-aed7-fd43d5e4cd12"
            }

        };
        const staticStyle = {
            "style": {
                "backgroundColor": "#717171",
                "border": "1px solid #00ffff"
            }
        };
        const conditionalStyle = {
            "conditionId": "39584410-cbf9-499e-96dc-76f27e69885d",
            "style": {
                "isStyleInvisible": "",
                "backgroundColor": "#717171",
                "border": "1px solid #ffff00"
            }
        };

        beforeEach(() => {
            displayLayoutItem = {
                "composition": [
                ],
                "configuration": {
                    "items": [
                        {
                            "fill": "#717171",
                            "stroke": "",
                            "x": 1,
                            "y": 1,
                            "width": 10,
                            "height": 5,
                            "type": "box-view",
                            "id": "89b88746-d325-487b-aec4-11b79afff9e8"
                        },
                        {
                            "x": 18,
                            "y": 9,
                            "x2": 23,
                            "y2": 4,
                            "stroke": "#717171",
                            "type": "line-view",
                            "id": "57d49a28-7863-43bd-9593-6570758916f0"
                        },
                        {
                            "width": 32,
                            "height": 18,
                            "x": 36,
                            "y": 8,
                            "identifier": {
                                "key": "~TEST~image",
                                "namespace": "test-space"
                            },
                            "hasFrame": true,
                            "type": "subobject-view",
                            "id": "6d9fe81b-a3ce-4e59-b404-a4a0be1a5d85"
                        }
                    ],
                    "layoutGrid": [
                        10,
                        10
                    ]
                },
                "name": "Display Layout",
                "type": "layout",
                "identifier": {
                    "namespace": "",
                    "key": "c5e636c1-6771-4c9c-b933-8665cab189b3"
                }
            };
            lineLayoutItem = {
                "x": 18,
                "y": 9,
                "x2": 23,
                "y2": 4,
                "stroke": "#717171",
                "type": "line-view",
                "id": "57d49a28-7863-43bd-9593-6570758916f0"
            };
            boxLayoutItem = {
                "fill": "#717171",
                "stroke": "",
                "x": 1,
                "y": 1,
                "width": 10,
                "height": 5,
                "type": "box-view",
                "id": "89b88746-d325-487b-aec4-11b79afff9e8"
            };
            notCreatableObjectItem = {
                "width": 32,
                "height": 18,
                "x": 36,
                "y": 8,
                "identifier": {
                    "key": "~TEST~image",
                    "namespace": "test-space"
                },
                "hasFrame": true,
                "type": "subobject-view",
                "id": "6d9fe81b-a3ce-4e59-b404-a4a0be1a5d85"
            };
            notCreatableObject = {
                "identifier": {
                    "key": "~TEST~image",
                    "namespace": "test-space"
                },
                "name": "test~image",
                "location": "test-space:~TEST",
                "type": "test.image",
                "telemetry": {
                    "values": [
                        {
                            "key": "value",
                            "name": "Value",
                            "hints": {
                                "image": 1,
                                "priority": 0
                            },
                            "format": "image",
                            "source": "value"
                        },
                        {
                            "key": "utc",
                            "source": "timestamp",
                            "name": "Timestamp",
                            "format": "iso",
                            "hints": {
                                "domain": 1,
                                "priority": 1
                            }
                        }
                    ]
                }
            };
            selection = [
                [{
                    context: {
                        "layoutItem": lineLayoutItem,
                        "index": 1
                    }
                },
                {
                    context: {
                        "item": displayLayoutItem,
                        "supportsMultiSelect": true
                    }
                }],
                [{
                    context: {
                        "layoutItem": boxLayoutItem,
                        "index": 0
                    }
                },
                {
                    context: {
                        item: displayLayoutItem,
                        "supportsMultiSelect": true
                    }
                }],
                [{
                    context: {
                        "item": notCreatableObject,
                        "layoutItem": notCreatableObjectItem,
                        "index": 2
                    }
                },
                {
                    context: {
                        item: displayLayoutItem,
                        "supportsMultiSelect": true
                    }
                }]
            ];
            let viewContainer = document.createElement('div');
            child.append(viewContainer);
            component = new Vue({
                el: viewContainer,
                components: {
                    StylesView
                },
                provide: {
                    openmct: openmct,
                    selection: selection,
                    stylesManager
                },
                template: '<styles-view/>'
            });

            return Vue.nextTick().then(() => {
                styleViewComponentObject = component.$root.$children[0];
                styleViewComponentObject.setEditState(true);
            });
        });

        it('initializes the items in the view', () => {
            expect(styleViewComponentObject.items.length).toBe(3);
        });

        it('initializes conditional styles', () => {
            styleViewComponentObject.conditionSetDomainObject = conditionSetDomainObject;
            styleViewComponentObject.conditionalStyles = [];
            styleViewComponentObject.initializeConditionalStyles();
            expect(styleViewComponentObject.conditionalStyles.length).toBe(2);
        });

        it('updates applicable conditional styles', () => {
            styleViewComponentObject.conditionSetDomainObject = conditionSetDomainObject;
            styleViewComponentObject.conditionalStyles = [];
            styleViewComponentObject.initializeConditionalStyles();
            expect(styleViewComponentObject.conditionalStyles.length).toBe(2);
            styleViewComponentObject.updateConditionalStyle(conditionalStyle, 'border');

            return Vue.nextTick().then(() => {
                expect(styleViewComponentObject.domainObject.configuration.objectStyles).toBeDefined();
                [boxLayoutItem, lineLayoutItem, notCreatableObjectItem].forEach((item) => {
                    const itemStyles = styleViewComponentObject.domainObject.configuration.objectStyles[item.id].styles;
                    expect(itemStyles.length).toBe(2);
                    const foundStyle = itemStyles.find((style) => {
                        return style.conditionId === conditionalStyle.conditionId;
                    });
                    expect(foundStyle).toBeDefined();
                    const applicableStyles = getApplicableStylesForItem(styleViewComponentObject.domainObject, item);
                    const applicableStylesKeys = Object.keys(applicableStyles).concat(['isStyleInvisible']);
                    Object.keys(foundStyle.style).forEach((key) => {
                        expect(applicableStylesKeys.indexOf(key)).toBeGreaterThan(-1);
                        expect(foundStyle.style[key]).toEqual(conditionalStyle.style[key]);
                    });
                });
            });
        });

        it('updates applicable static styles', () => {
            styleViewComponentObject.updateStaticStyle(staticStyle, 'border');

            return Vue.nextTick().then(() => {
                expect(styleViewComponentObject.domainObject.configuration.objectStyles).toBeDefined();
                [boxLayoutItem, lineLayoutItem, notCreatableObjectItem].forEach((item) => {
                    const itemStyle = styleViewComponentObject.domainObject.configuration.objectStyles[item.id].staticStyle;
                    expect(itemStyle).toBeDefined();
                    const applicableStyles = getApplicableStylesForItem(styleViewComponentObject.domainObject, item);
                    const applicableStylesKeys = Object.keys(applicableStyles).concat(['isStyleInvisible']);
                    Object.keys(itemStyle.style).forEach((key) => {
                        expect(applicableStylesKeys.indexOf(key)).toBeGreaterThan(-1);
                        expect(itemStyle.style[key]).toEqual(staticStyle.style[key]);
                    });
                });
            });
        });

    });

    describe('the condition check for staleness', () => {
        let conditionSetDomainObject;

        beforeEach(() => {
            conditionSetDomainObject = {
                "configuration": {
                    "conditionTestData": [
                        {
                            "telemetry": "",
                            "metadata": "",
                            "input": ""
                        }
                    ],
                    "conditionCollection": [
                        {
                            "id": "39584410-cbf9-499e-96dc-76f27e69885d",
                            "configuration": {
                                "name": "Unnamed Condition",
                                "output": "Any stale telemetry",
                                "trigger": "all",
                                "criteria": [
                                    {
                                        "id": "35400132-63b0-425c-ac30-8197df7d5862",
                                        "telemetry": "any",
                                        "operation": "isStale",
                                        "input": [
                                            "0.2"
                                        ],
                                        "metadata": "dataReceived"
                                    }
                                ]
                            },
                            "summary": "Match if all criteria are met: Any telemetry is stale after 5 seconds"
                        },
                        {
                            "isDefault": true,
                            "id": "2532d90a-e0d6-4935-b546-3123522da2de",
                            "configuration": {
                                "name": "Default",
                                "output": "Default",
                                "trigger": "all",
                                "criteria": [
                                ]
                            },
                            "summary": ""
                        }
                    ]
                },
                "composition": [
                    {
                        "namespace": "",
                        "key": "test-object"
                    }
                ],
                "telemetry": {
                },
                "name": "Condition Set",
                "type": "conditionSet",
                "identifier": {
                    "namespace": "",
                    "key": "cf4456a9-296a-4e6b-b182-62ed29cd15b9"
                }

            };
        });

        it('should evaluate as stale when telemetry is not received in the allotted time', (done) => {
            let conditionMgr = new ConditionManager(conditionSetDomainObject, openmct);
            conditionMgr.on('conditionSetResultUpdated', mockListener);
            conditionMgr.telemetryObjects = {
                "test-object": testTelemetryObject
            };
            conditionMgr.updateConditionTelemetryObjects();
            setTimeout(() => {
                expect(mockListener).toHaveBeenCalledWith({
                    output: 'Any stale telemetry',
                    id: {
                        namespace: '',
                        key: 'cf4456a9-296a-4e6b-b182-62ed29cd15b9'
                    },
                    conditionId: '39584410-cbf9-499e-96dc-76f27e69885d',
                    utc: undefined
                });
                done();
            }, 400);
        });

        it('should not evaluate as stale when telemetry is received in the allotted time', (done) => {
            const date = 1;
            conditionSetDomainObject.configuration.conditionCollection[0].configuration.criteria[0].input = ["0.4"];
            let conditionMgr = new ConditionManager(conditionSetDomainObject, openmct);
            conditionMgr.on('conditionSetResultUpdated', mockListener);
            conditionMgr.telemetryObjects = {
                "test-object": testTelemetryObject
            };
            conditionMgr.updateConditionTelemetryObjects();
            conditionMgr.telemetryReceived(testTelemetryObject, {
                utc: date
            });
            setTimeout(() => {
                expect(mockListener).toHaveBeenCalledWith({
                    output: 'Default',
                    id: {
                        namespace: '',
                        key: 'cf4456a9-296a-4e6b-b182-62ed29cd15b9'
                    },
                    conditionId: '2532d90a-e0d6-4935-b546-3123522da2de',
                    utc: date
                });
                done();
            }, 300);
        });
    });

    describe('the condition evaluation', () => {
        let conditionSetDomainObject;

        beforeEach(() => {
            conditionSetDomainObject = {
                "configuration": {
                    "conditionTestData": [
                        {
                            "telemetry": "",
                            "metadata": "",
                            "input": ""
                        }
                    ],
                    "conditionCollection": [
                        {
                            "id": "39584410-cbf9-499e-96dc-76f27e69885f",
                            "configuration": {
                                "name": "Unnamed Condition0",
                                "output": "Any telemetry less than 0",
                                "trigger": "all",
                                "criteria": [
                                    {
                                        "id": "35400132-63b0-425c-ac30-8197df7d5864",
                                        "telemetry": "any",
                                        "operation": "lessThan",
                                        "input": [
                                            "0"
                                        ],
                                        "metadata": "some-key"
                                    }
                                ]
                            },
                            "summary": "Match if all criteria are met: Any telemetry value is less than 0"
                        },
                        {
                            "id": "39584410-cbf9-499e-96dc-76f27e69885d",
                            "configuration": {
                                "name": "Unnamed Condition",
                                "output": "Any telemetry greater than 0",
                                "trigger": "all",
                                "criteria": [
                                    {
                                        "id": "35400132-63b0-425c-ac30-8197df7d5862",
                                        "telemetry": "any",
                                        "operation": "greaterThan",
                                        "input": [
                                            "0"
                                        ],
                                        "metadata": "some-key"
                                    }
                                ]
                            },
                            "summary": "Match if all criteria are met: Any telemetry value is greater than 0"
                        },
                        {
                            "id": "39584410-cbf9-499e-96dc-76f27e69885e",
                            "configuration": {
                                "name": "Unnamed Condition1",
                                "output": "Any telemetry greater than 1",
                                "trigger": "all",
                                "criteria": [
                                    {
                                        "id": "35400132-63b0-425c-ac30-8197df7d5863",
                                        "telemetry": "any",
                                        "operation": "greaterThan",
                                        "input": [
                                            "1"
                                        ],
                                        "metadata": "some-key"
                                    }
                                ]
                            },
                            "summary": "Match if all criteria are met: Any telemetry value is greater than 1"
                        },
                        {
                            "isDefault": true,
                            "id": "2532d90a-e0d6-4935-b546-3123522da2de",
                            "configuration": {
                                "name": "Default",
                                "output": "Default",
                                "trigger": "all",
                                "criteria": [
                                ]
                            },
                            "summary": ""
                        }
                    ]
                },
                "composition": [
                    {
                        "namespace": "",
                        "key": "test-object"
                    }
                ],
                "telemetry": {
                },
                "name": "Condition Set",
                "type": "conditionSet",
                "identifier": {
                    "namespace": "",
                    "key": "cf4456a9-296a-4e6b-b182-62ed29cd15b9"
                }

            };
        });

        it('should stop evaluating conditions when a condition evaluates to true', () => {
            const date = Date.now();
            let conditionMgr = new ConditionManager(conditionSetDomainObject, openmct);
            conditionMgr.on('conditionSetResultUpdated', mockListener);
            conditionMgr.telemetryObjects = {
                "test-object": testTelemetryObject
            };
            conditionMgr.updateConditionTelemetryObjects();
            conditionMgr.telemetryReceived(testTelemetryObject, {
                "some-key": 2,
                utc: date
            });
            let result = conditionMgr.conditions.map(condition => condition.result);
            expect(result[2]).toBeUndefined();
        });
    });
});
