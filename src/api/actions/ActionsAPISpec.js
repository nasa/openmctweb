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

import ActionsAPI from './ActionsAPI';
import { createOpenMct, resetApplicationState } from '../../utils/testing';
import ActionCollection from './ActionCollection';

describe('The Actions API', () => {
    let openmct;
    let actionsAPI;
    let mockAction;
    let mockObjectPath;
    let mockObjectPathAction;
    let mockViewContext1;

    beforeEach(() => {
        openmct = createOpenMct();
        actionsAPI = new ActionsAPI(openmct);
        mockObjectPathAction = {
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
        };
        mockAction = {
            name: 'Test Action View',
            key: 'test-action-view',
            cssClass: 'test-action-view',
            description: 'This is a test action for view',
            group: 'action',
            priority: 9,
            appliesTo: (objectPath, view = {}) => {
                if (view.getViewContext) {
                    let viewContext = view.getViewContext();

                    return viewContext.onlyAppliesToTestCase;
                }

                return false;
            },
            invoke: () => {
            }
        };
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
        mockViewContext1 = {
            getViewContext: () => {
                return {
                    onlyAppliesToTestCase: true
                };
            }
        };
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    describe("register method", () => {
        it("adds action to ActionsAPI", () => {
            actionsAPI.register(mockAction);

            let actionCollection = actionsAPI.get(mockObjectPath, mockViewContext1);
            let action = actionCollection.getActionsObject()[mockAction.key];

            expect(action.key).toEqual(mockAction.key);
            expect(action.name).toEqual(mockAction.name);
        });
    });

    describe("get method", () => {
        beforeEach(() => {
            actionsAPI.register(mockAction);
            actionsAPI.register(mockObjectPathAction);
        });

        it("returns an ActionCollection when invoked with an objectPath only", () => {
            let actionCollection = actionsAPI.get(mockObjectPath);
            let instanceOfActionCollection = actionCollection instanceof ActionCollection;

            expect(instanceOfActionCollection).toBeTrue();
        });

        it("returns an ActionCollection when invoked with an objectPath and view", () => {
            let actionCollection = actionsAPI.get(mockObjectPath, mockViewContext1);
            let instanceOfActionCollection = actionCollection instanceof ActionCollection;

            expect(instanceOfActionCollection).toBeTrue();
        });

        it("returns relevant actions when invoked with objectPath only", () => {
            let actionCollection = actionsAPI.get(mockObjectPath);
            let action = actionCollection.getActionsObject()[mockObjectPathAction.key];

            expect(action.key).toEqual(mockObjectPathAction.key);
            expect(action.name).toEqual(mockObjectPathAction.name);
        });

        it("returns relevant actions when invoked with objectPath and view", () => {
            let actionCollection = actionsAPI.get(mockObjectPath, mockViewContext1);
            let action = actionCollection.getActionsObject()[mockAction.key];

            expect(action.key).toEqual(mockAction.key);
            expect(action.name).toEqual(mockAction.name);
        });
    });
});
