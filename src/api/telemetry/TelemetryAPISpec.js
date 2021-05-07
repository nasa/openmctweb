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

define([
    './TelemetryAPI'
], function (
    TelemetryAPI
) {
    xdescribe('Telemetry API', function () {
        let openmct;
        let telemetryAPI;
        let mockTypeService;

        beforeEach(function () {
            openmct = {
                time: jasmine.createSpyObj('timeAPI', [
                    'timeSystem',
                    'bounds'
                ]),
                $injector: jasmine.createSpyObj('injector', [
                    'get'
                ])
            };
            mockTypeService = jasmine.createSpyObj('typeService', [
                'getType'
            ]);
            openmct.$injector.get.and.returnValue(mockTypeService);
            openmct.time.timeSystem.and.returnValue({key: 'system'});
            openmct.time.bounds.and.returnValue({
                start: 0,
                end: 1
            });
            telemetryAPI = new TelemetryAPI(openmct);

        });

        describe('telemetry providers', function () {
            let telemetryProvider;
            let domainObject;

            beforeEach(function () {
                telemetryProvider = jasmine.createSpyObj('telemetryProvider', [
                    'supportsSubscribe',
                    'subscribe',
                    'supportsRequest',
                    'request'
                ]);
                domainObject = {
                    identifier: {
                        key: 'a',
                        namespace: 'b'
                    },
                    type: 'sample-type'
                };
            });

            it('provides consistent results without providers', function () {
                const unsubscribe = telemetryAPI.subscribe(domainObject);
                expect(unsubscribe).toEqual(jasmine.any(Function));

                const response = telemetryAPI.request(domainObject);
                expect(response).toEqual(jasmine.any(Promise));
            });

            it('skips providers that do not match', function () {
                telemetryProvider.supportsSubscribe.and.returnValue(false);
                telemetryProvider.supportsRequest.and.returnValue(false);
                telemetryAPI.addProvider(telemetryProvider);

                const callback = jasmine.createSpy('callback');
                const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.supportsSubscribe)
                    .toHaveBeenCalledWith(domainObject);
                expect(telemetryProvider.subscribe).not.toHaveBeenCalled();
                expect(unsubscribe).toEqual(jasmine.any(Function));

                const response = telemetryAPI.request(domainObject);
                expect(telemetryProvider.supportsRequest)
                    .toHaveBeenCalledWith(domainObject, jasmine.any(Object));
                expect(telemetryProvider.request).not.toHaveBeenCalled();
                expect(response).toEqual(jasmine.any(Promise));
            });

            it('sends subscribe calls to matching providers', function () {
                const unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.and.returnValue(unsubFunc);
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                const callback = jasmine.createSpy('callback');
                const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.supportsSubscribe.calls.count()).toBe(1);
                expect(telemetryProvider.supportsSubscribe)
                    .toHaveBeenCalledWith(domainObject);
                expect(telemetryProvider.subscribe.calls.count()).toBe(1);
                expect(telemetryProvider.subscribe)
                    .toHaveBeenCalledWith(domainObject, jasmine.any(Function));

                const notify = telemetryProvider.subscribe.calls.mostRecent().args[1];
                notify('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');

                expect(unsubscribe).toEqual(jasmine.any(Function));
                expect(unsubFunc).not.toHaveBeenCalled();
                unsubscribe();
                expect(unsubFunc).toHaveBeenCalled();

                notify('otherValue');
                expect(callback).not.toHaveBeenCalledWith('otherValue');
            });

            it('subscribes once per object', function () {
                const unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.and.returnValue(unsubFunc);
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                const callback = jasmine.createSpy('callback');
                const callbacktwo = jasmine.createSpy('callback two');
                const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                const unsubscribetwo = telemetryAPI.subscribe(domainObject, callbacktwo);

                expect(telemetryProvider.subscribe.calls.count()).toBe(1);

                const notify = telemetryProvider.subscribe.calls.mostRecent().args[1];
                notify('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');
                expect(callbacktwo).toHaveBeenCalledWith('someValue');

                unsubscribe();
                expect(unsubFunc).not.toHaveBeenCalled();
                notify('otherValue');
                expect(callback).not.toHaveBeenCalledWith('otherValue');
                expect(callbacktwo).toHaveBeenCalledWith('otherValue');

                unsubscribetwo();
                expect(unsubFunc).toHaveBeenCalled();
                notify('anotherValue');
                expect(callback).not.toHaveBeenCalledWith('anotherValue');
                expect(callbacktwo).not.toHaveBeenCalledWith('anotherValue');
            });

            it('only deletes subscription cache when there are no more subscribers', function () {
                const unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.and.returnValue(unsubFunc);
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                const callback = jasmine.createSpy('callback');
                const callbacktwo = jasmine.createSpy('callback two');
                const callbackThree = jasmine.createSpy('callback three');
                const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                const unsubscribeTwo = telemetryAPI.subscribe(domainObject, callbacktwo);

                expect(telemetryProvider.subscribe.calls.count()).toBe(1);
                unsubscribe();
                const unsubscribeThree = telemetryAPI.subscribe(domainObject, callbackThree);
                // Regression test for where subscription cache was deleted on each unsubscribe, resulting in
                // superfluous additional subscriptions. If the subscription cache is being deleted on each unsubscribe,
                // then a subsequent subscribe will result in a new subscription at the provider.
                expect(telemetryProvider.subscribe.calls.count()).toBe(1);
                unsubscribeTwo();
                unsubscribeThree();
            });

            it('does subscribe/unsubscribe', function () {
                const unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.and.returnValue(unsubFunc);
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                const callback = jasmine.createSpy('callback');
                let unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.subscribe.calls.count()).toBe(1);
                unsubscribe();

                unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.subscribe.calls.count()).toBe(2);
                unsubscribe();
            });

            it('subscribes for different object', function () {
                const unsubFuncs = [];
                const notifiers = [];
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryProvider.subscribe.and.callFake(function (obj, cb) {
                    const unsubFunc = jasmine.createSpy('unsubscribe ' + unsubFuncs.length);
                    unsubFuncs.push(unsubFunc);
                    notifiers.push(cb);

                    return unsubFunc;
                });
                telemetryAPI.addProvider(telemetryProvider);

                const otherDomainObject = JSON.parse(JSON.stringify(domainObject));
                otherDomainObject.identifier.namespace = 'other';

                const callback = jasmine.createSpy('callback');
                const callbacktwo = jasmine.createSpy('callback two');

                const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                const unsubscribetwo = telemetryAPI.subscribe(otherDomainObject, callbacktwo);

                expect(telemetryProvider.subscribe.calls.count()).toBe(2);

                notifiers[0]('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');
                expect(callbacktwo).not.toHaveBeenCalledWith('someValue');

                notifiers[1]('anotherValue');
                expect(callback).not.toHaveBeenCalledWith('anotherValue');
                expect(callbacktwo).toHaveBeenCalledWith('anotherValue');

                unsubscribe();
                expect(unsubFuncs[0]).toHaveBeenCalled();
                expect(unsubFuncs[1]).not.toHaveBeenCalled();

                unsubscribetwo();
                expect(unsubFuncs[1]).toHaveBeenCalled();
            });

            it('sends requests to matching providers', function () {
                const telemPromise = Promise.resolve([]);
                telemetryProvider.supportsRequest.and.returnValue(true);
                telemetryProvider.request.and.returnValue(telemPromise);
                telemetryAPI.addProvider(telemetryProvider);

                const result = telemetryAPI.request(domainObject);
                expect(result).toBe(telemPromise);
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    domainObject,
                    jasmine.any(Object)
                );
                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    domainObject,
                    jasmine.any(Object)
                );
            });

            it('generates default request options', function () {
                telemetryProvider.supportsRequest.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                telemetryAPI.request(domainObject);
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                telemetryProvider.supportsRequest.calls.reset();
                telemetryProvider.request.calls.reset();

                telemetryAPI.request(domainObject, {});
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );
            });

            it('does not overwrite existing request options', function () {
                telemetryProvider.supportsRequest.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                telemetryAPI.request(domainObject, {
                    start: 20,
                    end: 30,
                    domain: 'someDomain'
                });

                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 20,
                        end: 30,
                        domain: 'someDomain'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 20,
                        end: 30,
                        domain: 'someDomain'
                    }
                );
            });
        });
        describe('metadata', function () {
            let mockMetadata = {};
            let mockObjectType = {
                typeDef: {}
            };
            beforeEach(function () {
                telemetryAPI.addProvider({
                    key: 'mockMetadataProvider',
                    supportsMetadata() {
                        return true;
                    },
                    getMetadata() {
                        return mockMetadata;
                    }
                });
                mockTypeService.getType.and.returnValue(mockObjectType);
            });
            it('respects explicit priority', function () {
                mockMetadata.values = [
                    {
                        key: "name",
                        name: "Name",
                        hints: {
                            priority: 2
                        }

                    },
                    {
                        key: "timestamp",
                        name: "Timestamp",
                        hints: {
                            priority: 1
                        }
                    },
                    {
                        key: "sin",
                        name: "Sine",
                        hints: {
                            priority: 4
                        }
                    },
                    {
                        key: "cos",
                        name: "Cosine",
                        hints: {
                            priority: 3
                        }
                    }
                ];
                let metadata = telemetryAPI.getMetadata({});
                let values = metadata.values();

                values.forEach((value, index) => {
                    expect(value.hints.priority).toBe(index + 1);
                });
            });
            it('if no explicit priority, defaults to order defined', function () {
                mockMetadata.values = [
                    {
                        key: "name",
                        name: "Name"

                    },
                    {
                        key: "timestamp",
                        name: "Timestamp"
                    },
                    {
                        key: "sin",
                        name: "Sine"
                    },
                    {
                        key: "cos",
                        name: "Cosine"
                    }
                ];
                let metadata = telemetryAPI.getMetadata({});
                let values = metadata.values();

                values.forEach((value, index) => {
                    expect(value.key).toBe(mockMetadata.values[index].key);
                });
            });
            it('respects domain priority', function () {
                mockMetadata.values = [
                    {
                        key: "name",
                        name: "Name"

                    },
                    {
                        key: "timestamp-utc",
                        name: "Timestamp UTC",
                        hints: {
                            domain: 2
                        }
                    },
                    {
                        key: "timestamp-local",
                        name: "Timestamp Local",
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        key: "sin",
                        name: "Sine",
                        hints: {
                            range: 2
                        }
                    },
                    {
                        key: "cos",
                        name: "Cosine",
                        hints: {
                            range: 1
                        }
                    }
                ];
                let metadata = telemetryAPI.getMetadata({});
                let values = metadata.valuesForHints(['domain']);

                expect(values[0].key).toBe('timestamp-local');
                expect(values[1].key).toBe('timestamp-utc');
            });
            it('respects range priority', function () {
                mockMetadata.values = [
                    {
                        key: "name",
                        name: "Name"

                    },
                    {
                        key: "timestamp-utc",
                        name: "Timestamp UTC",
                        hints: {
                            domain: 2
                        }
                    },
                    {
                        key: "timestamp-local",
                        name: "Timestamp Local",
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        key: "sin",
                        name: "Sine",
                        hints: {
                            range: 2
                        }
                    },
                    {
                        key: "cos",
                        name: "Cosine",
                        hints: {
                            range: 1
                        }
                    }
                ];
                let metadata = telemetryAPI.getMetadata({});
                let values = metadata.valuesForHints(['range']);

                expect(values[0].key).toBe('cos');
                expect(values[1].key).toBe('sin');
            });
            it('respects priority and domain ordering', function () {
                mockMetadata.values = [
                    {
                        key: "id",
                        name: "ID",
                        hints: {
                            priority: 2
                        }
                    },
                    {
                        key: "name",
                        name: "Name",
                        hints: {
                            priority: 1
                        }

                    },
                    {
                        key: "timestamp-utc",
                        name: "Timestamp UTC",
                        hints: {
                            domain: 2,
                            priority: 1
                        }
                    },
                    {
                        key: "timestamp-local",
                        name: "Timestamp Local",
                        hints: {
                            domain: 1,
                            priority: 2
                        }
                    },
                    {
                        key: "timestamp-pst",
                        name: "Timestamp PST",
                        hints: {
                            domain: 3,
                            priority: 2
                        }
                    },
                    {
                        key: "sin",
                        name: "Sine"
                    },
                    {
                        key: "cos",
                        name: "Cosine"
                    }
                ];
                let metadata = telemetryAPI.getMetadata({});
                let values = metadata.valuesForHints(['priority', 'domain']);
                [
                    'timestamp-utc',
                    'timestamp-local',
                    'timestamp-pst'
                ].forEach((key, index) => {
                    expect(values[index].key).toBe(key);
                });
            });
        });
    });
});
