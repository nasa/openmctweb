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

import ActionCollection from './ActionCollection';
import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe('The ActionCollection', () => {
    let openmct;
    let actionCollection;
    let mockApplicableActions;
    let mockObjectPath;
    let mockView;
    let mockIdentifierService;

    beforeEach(() => {
        openmct = createOpenMct();
        openmct.$injector = jasmine.createSpyObj('$injector', ['get']);
        mockIdentifierService = jasmine.createSpyObj(
            'identifierService',
            ['parse']
        );
        mockIdentifierService.parse.and.returnValue({
            getSpace: () => {
                return '';
            }
        });

        openmct.$injector.get.and.returnValue(mockIdentifierService);
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
                type: 'fake-folder',
                identifier: {
                    key: 'mock-parent-folder',
                    namespace: ''
                }
            }
        ];
        openmct.objects.addProvider('', jasmine.createSpyObj('mockMutableObjectProvider', [
            'create',
            'update'
        ]));
        mockView = {
            getViewContext: () => {
                return {
                    onlyAppliesToTestCase: true
                };
            }
        };
        mockApplicableActions = {
            'test-action-object-path': {
                name: 'Test Action Object Path',
                key: 'test-action-object-path',
                cssClass: 'test-action-object-path',
                description: 'This is a test action for object path',
                group: 'action',
                priority: 9,
                appliesTo: (objectPath) => {
                    if (objectPath.length) {
                        return objectPath[0].type === 'fake-folder';
                    }

                    return false;
                },
                invoke: () => {
                }
            },
            'test-action-view': {
                name: 'Test Action View',
                key: 'test-action-view',
                cssClass: 'test-action-view',
                description: 'This is a test action for view',
                group: 'action',
                priority: 9,
                showInStatusBar: true,
                appliesTo: (objectPath, view = {}) => {
                    if (view.getViewContext) {
                        let viewContext = view.getViewContext();

                        return viewContext.onlyAppliesToTestCase;
                    }

                    return false;
                },
                invoke: () => {
                }
            }
        };

        actionCollection = new ActionCollection(mockApplicableActions, mockObjectPath, mockView, openmct);
    });

    afterEach(() => {
        actionCollection.destroy();
        resetApplicationState(openmct);
    });

    describe("disable method invoked with action keys", () => {
        it("marks those actions as isDisabled", () => {
            let actionKey = 'test-action-object-path';
            let actionsObject = actionCollection.getActionsObject();
            let action = actionsObject[actionKey];

            expect(action.isDisabled).toBeFalsy();

            actionCollection.disable([actionKey]);
            actionsObject = actionCollection.getActionsObject();
            action = actionsObject[actionKey];

            expect(action.isDisabled).toBeTrue();
        });
    });

    describe("enable method invoked with action keys", () => {
        it("marks the isDisabled property as false", () => {
            let actionKey = 'test-action-object-path';

            actionCollection.disable([actionKey]);

            let actionsObject = actionCollection.getActionsObject();
            let action = actionsObject[actionKey];

            expect(action.isDisabled).toBeTrue();

            actionCollection.enable([actionKey]);
            actionsObject = actionCollection.getActionsObject();
            action = actionsObject[actionKey];

            expect(action.isDisabled).toBeFalse();
        });
    });

    describe("hide method invoked with action keys", () => {
        it("marks those actions as isHidden", () => {
            let actionKey = 'test-action-object-path';
            let actionsObject = actionCollection.getActionsObject();
            let action = actionsObject[actionKey];

            expect(action.isHidden).toBeFalsy();

            actionCollection.hide([actionKey]);
            actionsObject = actionCollection.getActionsObject();
            action = actionsObject[actionKey];

            expect(action.isHidden).toBeTrue();
        });
    });

    describe("show method invoked with action keys", () => {
        it("marks the isHidden property as false", () => {
            let actionKey = 'test-action-object-path';

            actionCollection.hide([actionKey]);

            let actionsObject = actionCollection.getActionsObject();
            let action = actionsObject[actionKey];

            expect(action.isHidden).toBeTrue();

            actionCollection.show([actionKey]);
            actionsObject = actionCollection.getActionsObject();
            action = actionsObject[actionKey];

            expect(action.isHidden).toBeFalse();
        });
    });

    describe("getVisibleActions method", () => {
        it("returns an array of non hidden actions", () => {
            let action1Key = 'test-action-object-path';
            let action2Key = 'test-action-view';

            actionCollection.hide([action1Key]);

            let visibleActions = actionCollection.getVisibleActions();

            expect(Array.isArray(visibleActions)).toBeTrue();
            expect(visibleActions.length).toEqual(1);
            expect(visibleActions[0].key).toEqual(action2Key);

            actionCollection.show([action1Key]);
            visibleActions = actionCollection.getVisibleActions();

            expect(visibleActions.length).toEqual(2);
        });
    });

    describe("getStatusBarActions method", () => {
        it("returns an array of non disabled, non hidden statusBar actions", () => {
            let action2Key = 'test-action-view';

            let statusBarActions = actionCollection.getStatusBarActions();

            expect(Array.isArray(statusBarActions)).toBeTrue();
            expect(statusBarActions.length).toEqual(1);
            expect(statusBarActions[0].key).toEqual(action2Key);

            actionCollection.disable([action2Key]);
            statusBarActions = actionCollection.getStatusBarActions();

            expect(statusBarActions.length).toEqual(0);

            actionCollection.enable([action2Key]);
            statusBarActions = actionCollection.getStatusBarActions();

            expect(statusBarActions.length).toEqual(1);
            expect(statusBarActions[0].key).toEqual(action2Key);

            actionCollection.hide([action2Key]);
            statusBarActions = actionCollection.getStatusBarActions();

            expect(statusBarActions.length).toEqual(0);
        });
    });
});
