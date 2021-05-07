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

define(['../src/ConditionManager'], function (ConditionManager) {
    xdescribe('A Summary Widget Condition Manager', function () {
        let conditionManager;
        let mockDomainObject;
        let mockCompObject1;
        let mockCompObject2;
        let mockCompObject3;
        let mockMetadata;
        let mockTelemetryCallbacks;
        let mockEventCallbacks;
        let unsubscribeSpies;
        let unregisterSpies;
        let mockMetadataManagers;
        let mockComposition;
        let mockOpenMCT;
        let mockTelemetryAPI;
        let addCallbackSpy;
        let loadCallbackSpy;
        let removeCallbackSpy;
        let telemetryCallbackSpy;
        let metadataCallbackSpy;
        let telemetryRequests;
        let mockTelemetryValues;
        let mockTelemetryValues2;
        let mockConditionEvaluator;

        beforeEach(function () {
            mockDomainObject = {
                identifier: {
                    key: 'testKey'
                },
                name: 'Test Object',
                composition: [{
                    mockCompObject1: {
                        key: 'mockCompObject1'
                    },
                    mockCompObject2: {
                        key: 'mockCompObject2'
                    }
                }],
                configuration: {}
            };
            mockCompObject1 = {
                identifier: {
                    key: 'mockCompObject1'
                },
                name: 'Object 1'
            };
            mockCompObject2 = {
                identifier: {
                    key: 'mockCompObject2'
                },
                name: 'Object 2'
            };
            mockCompObject3 = {
                identifier: {
                    key: 'mockCompObject3'
                },
                name: 'Object 3'
            };
            mockMetadata = {
                mockCompObject1: {
                    property1: {
                        key: 'property1',
                        name: 'Property 1',
                        format: 'string',
                        hints: {}
                    },
                    property2: {
                        key: 'property2',
                        name: 'Property 2',
                        hints: {
                            domain: 1
                        }
                    }
                },
                mockCompObject2: {
                    property3: {
                        key: 'property3',
                        name: 'Property 3',
                        format: 'string',
                        hints: {}
                    },
                    property4: {
                        key: 'property4',
                        name: 'Property 4',
                        hints: {
                            range: 1
                        }
                    }
                },
                mockCompObject3: {
                    property1: {
                        key: 'property1',
                        name: 'Property 1',
                        hints: {}
                    },
                    property2: {
                        key: 'property2',
                        name: 'Property 2',
                        hints: {}
                    }
                }
            };
            mockTelemetryCallbacks = {};
            mockEventCallbacks = {};
            unsubscribeSpies = jasmine.createSpyObj('mockUnsubscribeFunction', [
                'mockCompObject1',
                'mockCompObject2',
                'mockCompObject3'
            ]);
            unregisterSpies = jasmine.createSpyObj('mockUnregisterFunctions', [
                'load',
                'remove',
                'add'
            ]);
            mockTelemetryValues = {
                mockCompObject1: {
                    property1: 'Its a string',
                    property2: 42
                },
                mockCompObject2: {
                    property3: 'Execute order:',
                    property4: 66
                },
                mockCompObject3: {
                    property1: 'Testing 1 2 3',
                    property2: 9000
                }
            };
            mockTelemetryValues2 = {
                mockCompObject1: {
                    property1: 'Its a different string',
                    property2: 44
                },
                mockCompObject2: {
                    property3: 'Execute catch:',
                    property4: 22
                },
                mockCompObject3: {
                    property1: 'Walrus',
                    property2: 22
                }
            };
            mockMetadataManagers = {
                mockCompObject1: {
                    values: jasmine.createSpy('metadataManager').and.returnValue(
                        Object.values(mockMetadata.mockCompObject1)
                    )
                },
                mockCompObject2: {
                    values: jasmine.createSpy('metadataManager').and.returnValue(
                        Object.values(mockMetadata.mockCompObject2)
                    )
                },
                mockCompObject3: {
                    values: jasmine.createSpy('metadataManager').and.returnValue(
                        Object.values(mockMetadata.mockCompObject2)
                    )
                }
            };

            mockComposition = jasmine.createSpyObj('composition', [
                'on',
                'off',
                'load',
                'triggerCallback'
            ]);
            mockComposition.on.and.callFake(function (event, callback, context) {
                mockEventCallbacks[event] = callback.bind(context);
            });
            mockComposition.off.and.callFake(function (event) {
                unregisterSpies[event]();
            });
            mockComposition.load.and.callFake(function () {
                mockComposition.triggerCallback('add', mockCompObject1);
                mockComposition.triggerCallback('add', mockCompObject2);
                mockComposition.triggerCallback('load');
            });
            mockComposition.triggerCallback.and.callFake(function (event, obj) {
                if (event === 'add') {
                    mockEventCallbacks.add(obj);
                } else if (event === 'remove') {
                    mockEventCallbacks.remove(obj.identifier);
                } else {
                    mockEventCallbacks[event]();
                }
            });
            telemetryRequests = [];
            mockTelemetryAPI = jasmine.createSpyObj('telemetryAPI', [
                'request',
                'isTelemetryObject',
                'getMetadata',
                'subscribe',
                'triggerTelemetryCallback'
            ]);
            mockTelemetryAPI.request.and.callFake(function (obj) {
                const req = {
                    object: obj
                };
                req.promise = new Promise(function (resolve, reject) {
                    req.resolve = resolve;
                    req.reject = reject;
                });
                telemetryRequests.push(req);

                return req.promise;
            });
            mockTelemetryAPI.isTelemetryObject.and.returnValue(true);
            mockTelemetryAPI.getMetadata.and.callFake(function (obj) {
                return mockMetadataManagers[obj.identifier.key];
            });
            mockTelemetryAPI.subscribe.and.callFake(function (obj, callback) {
                mockTelemetryCallbacks[obj.identifier.key] = callback;

                return unsubscribeSpies[obj.identifier.key];
            });
            mockTelemetryAPI.triggerTelemetryCallback.and.callFake(function (key) {
                mockTelemetryCallbacks[key](mockTelemetryValues2[key]);
            });

            mockOpenMCT = {
                telemetry: mockTelemetryAPI,
                composition: {}
            };
            mockOpenMCT.composition.get = jasmine.createSpy('get').and.returnValue(mockComposition);

            loadCallbackSpy = jasmine.createSpy('loadCallbackSpy');
            addCallbackSpy = jasmine.createSpy('addCallbackSpy');
            removeCallbackSpy = jasmine.createSpy('removeCallbackSpy');
            metadataCallbackSpy = jasmine.createSpy('metadataCallbackSpy');
            telemetryCallbackSpy = jasmine.createSpy('telemetryCallbackSpy');

            conditionManager = new ConditionManager(mockDomainObject, mockOpenMCT);
            conditionManager.on('load', loadCallbackSpy);
            conditionManager.on('add', addCallbackSpy);
            conditionManager.on('remove', removeCallbackSpy);
            conditionManager.on('metadata', metadataCallbackSpy);
            conditionManager.on('receiveTelemetry', telemetryCallbackSpy);

            mockConditionEvaluator = jasmine.createSpy('mockConditionEvaluator');
            mockConditionEvaluator.execute = jasmine.createSpy('execute');
            conditionManager.evaluator = mockConditionEvaluator;
        });

        it('loads the initial composition and invokes the appropriate handlers', function () {
            mockComposition.triggerCallback('load');
            expect(conditionManager.getComposition()).toEqual({
                mockCompObject1: mockCompObject1,
                mockCompObject2: mockCompObject2
            });
            expect(loadCallbackSpy).toHaveBeenCalled();
            expect(conditionManager.loadCompleted()).toEqual(true);
        });

        it('loads metadata from composition and gets it upon request', function () {
            expect(conditionManager.getTelemetryMetadata('mockCompObject1'))
                .toEqual(mockMetadata.mockCompObject1);
            expect(conditionManager.getTelemetryMetadata('mockCompObject2'))
                .toEqual(mockMetadata.mockCompObject2);
        });

        it('maintains lists of global metadata, and does not duplicate repeated fields', function () {
            const allKeys = {
                property1: {
                    key: 'property1',
                    name: 'Property 1',
                    format: 'string',
                    hints: {}
                },
                property2: {
                    key: 'property2',
                    name: 'Property 2',
                    hints: {
                        domain: 1
                    }
                },
                property3: {
                    key: 'property3',
                    name: 'Property 3',
                    format: 'string',
                    hints: {}
                },
                property4: {
                    key: 'property4',
                    name: 'Property 4',
                    hints: {
                        range: 1
                    }
                }
            };
            expect(conditionManager.getTelemetryMetadata('all')).toEqual(allKeys);
            expect(conditionManager.getTelemetryMetadata('any')).toEqual(allKeys);
            mockComposition.triggerCallback('add', mockCompObject3);
            expect(conditionManager.getTelemetryMetadata('all')).toEqual(allKeys);
            expect(conditionManager.getTelemetryMetadata('any')).toEqual(allKeys);
        });

        it('loads and gets telemetry property types', function () {
            conditionManager.parseAllPropertyTypes();
            expect(conditionManager.getTelemetryPropertyType('mockCompObject1', 'property1'))
                .toEqual('string');
            expect(conditionManager.getTelemetryPropertyType('mockCompObject2', 'property4'))
                .toEqual('number');
            expect(conditionManager.metadataLoadCompleted()).toEqual(true);
            expect(metadataCallbackSpy).toHaveBeenCalled();
        });

        it('responds to a composition add event and invokes the appropriate handlers', function () {
            mockComposition.triggerCallback('add', mockCompObject3);
            expect(addCallbackSpy).toHaveBeenCalledWith(mockCompObject3);
            expect(conditionManager.getComposition()).toEqual({
                mockCompObject1: mockCompObject1,
                mockCompObject2: mockCompObject2,
                mockCompObject3: mockCompObject3
            });
        });

        it('responds to a composition remove event and invokes the appropriate handlers', function () {
            mockComposition.triggerCallback('remove', mockCompObject2);
            expect(removeCallbackSpy).toHaveBeenCalledWith({
                key: 'mockCompObject2'
            });
            expect(unsubscribeSpies.mockCompObject2).toHaveBeenCalled();
            expect(conditionManager.getComposition()).toEqual({
                mockCompObject1: mockCompObject1
            });
        });

        it('unregisters telemetry subscriptions and composition listeners on destroy', function () {
            mockComposition.triggerCallback('add', mockCompObject3);
            conditionManager.destroy();
            Object.values(unsubscribeSpies).forEach(function (spy) {
                expect(spy).toHaveBeenCalled();
            });
            Object.values(unregisterSpies).forEach(function (spy) {
                expect(spy).toHaveBeenCalled();
            });
        });

        it('populates its LAD cache with historial data on load, if available', function (done) {
            expect(telemetryRequests.length).toBe(2);
            expect(telemetryRequests[0].object).toBe(mockCompObject1);
            expect(telemetryRequests[1].object).toBe(mockCompObject2);

            expect(telemetryCallbackSpy).not.toHaveBeenCalled();

            telemetryCallbackSpy.and.callFake(function () {
                if (telemetryCallbackSpy.calls.count() === 2) {
                    expect(conditionManager.subscriptionCache.mockCompObject1.property1).toEqual('Its a string');
                    expect(conditionManager.subscriptionCache.mockCompObject2.property4).toEqual(66);
                    done();
                }
            });

            telemetryRequests[0].resolve([mockTelemetryValues.mockCompObject1]);
            telemetryRequests[1].resolve([mockTelemetryValues.mockCompObject2]);
        });

        it('updates its LAD cache upon recieving telemetry and invokes the appropriate handlers', function () {
            mockTelemetryAPI.triggerTelemetryCallback('mockCompObject1');
            expect(conditionManager.subscriptionCache.mockCompObject1.property1).toEqual('Its a different string');
            mockTelemetryAPI.triggerTelemetryCallback('mockCompObject2');
            expect(conditionManager.subscriptionCache.mockCompObject2.property4).toEqual(22);
            expect(telemetryCallbackSpy).toHaveBeenCalled();
        });

        it('evalutes a set of rules and returns the id of the'
           + 'last active rule, or the first if no rules are active', function () {
            const mockRuleOrder = ['default', 'rule0', 'rule1'];
            const mockRules = {
                default: {
                    getProperty: function () {}
                },
                rule0: {
                    getProperty: function () {}
                },
                rule1: {
                    getProperty: function () {}
                }
            };

            mockConditionEvaluator.execute.and.returnValue(false);
            expect(conditionManager.executeRules(mockRuleOrder, mockRules)).toEqual('default');
            mockConditionEvaluator.execute.and.returnValue(true);
            expect(conditionManager.executeRules(mockRuleOrder, mockRules)).toEqual('rule1');
        });

        it('gets the human-readable name of a composition object', function () {
            expect(conditionManager.getObjectName('mockCompObject1')).toEqual('Object 1');
            expect(conditionManager.getObjectName('all')).toEqual('all Telemetry');
        });

        it('gets the human-readable name of a telemetry field', function () {
            expect(conditionManager.getTelemetryPropertyName('mockCompObject1', 'property1'))
                .toEqual('Property 1');
            expect(conditionManager.getTelemetryPropertyName('mockCompObject2', 'property4'))
                .toEqual('Property 4');
        });

        it('gets its associated ConditionEvaluator', function () {
            expect(conditionManager.getEvaluator()).toEqual(mockConditionEvaluator);
        });

        it('allows forcing a receive telemetry event', function () {
            conditionManager.triggerTelemetryCallback();
            expect(telemetryCallbackSpy).toHaveBeenCalled();
        });
    });
});
