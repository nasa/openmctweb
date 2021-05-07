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
    './SummaryWidgetTelemetryProvider'
], function (
    SummaryWidgetTelemetryProvider
) {

    xdescribe('SummaryWidgetTelemetryProvider', function () {
        let telemObjectA;
        let telemObjectB;
        let summaryWidgetObject;
        let openmct;
        let telemUnsubscribes;
        let unobserver;
        let composition;
        let telemetryProvider;
        let loader;

        beforeEach(function () {
            telemObjectA = {
                identifier: {
                    namespace: 'a',
                    key: 'telem'
                }
            };
            telemObjectB = {
                identifier: {
                    namespace: 'b',
                    key: 'telem'
                }
            };
            summaryWidgetObject = {
                name: "Summary Widget",
                type: "summary-widget",
                identifier: {
                    namespace: 'base',
                    key: 'widgetId'
                },
                composition: [
                    'a:telem',
                    'b:telem'
                ],
                configuration: {
                    ruleOrder: [
                        "default",
                        "rule0",
                        "rule1"
                    ],
                    ruleConfigById: {
                        "default": {
                            name: "safe",
                            label: "Don't Worry",
                            message: "It's Ok",
                            id: "default",
                            icon: "a-ok",
                            style: {
                                "color": "#ffffff",
                                "background-color": "#38761d",
                                "border-color": "rgba(0,0,0,0)"
                            },
                            conditions: [
                                {
                                    object: "",
                                    key: "",
                                    operation: "",
                                    values: []
                                }
                            ],
                            trigger: "any"
                        },
                        "rule0": {
                            name: "A High",
                            label: "Start Worrying",
                            message: "A is a little high...",
                            id: "rule0",
                            icon: "a-high",
                            style: {
                                "color": "#000000",
                                "background-color": "#ffff00",
                                "border-color": "rgba(1,1,0,0)"
                            },
                            conditions: [
                                {
                                    object: "a:telem",
                                    key: "measurement",
                                    operation: "greaterThan",
                                    values: [
                                        50
                                    ]
                                }
                            ],
                            trigger: "any"
                        },
                        rule1: {
                            name: "B Low",
                            label: "WORRY!",
                            message: "B is Low",
                            id: "rule1",
                            icon: "b-low",
                            style: {
                                "color": "#ff00ff",
                                "background-color": "#ff0000",
                                "border-color": "rgba(1,0,0,0)"
                            },
                            conditions: [
                                {
                                    object: "b:telem",
                                    key: "measurement",
                                    operation: "lessThan",
                                    values: [
                                        10
                                    ]
                                }
                            ],
                            trigger: "any"
                        }
                    }
                }
            };
            openmct = {
                objects: jasmine.createSpyObj('objectAPI', [
                    'get',
                    'observe'
                ]),
                telemetry: jasmine.createSpyObj('telemetryAPI', [
                    'getMetadata',
                    'getFormatMap',
                    'request',
                    'subscribe',
                    'addProvider'
                ]),
                composition: jasmine.createSpyObj('compositionAPI', [
                    'get'
                ]),
                time: jasmine.createSpyObj('timeAPI', [
                    'getAllTimeSystems',
                    'timeSystem'
                ])
            };

            openmct.time.getAllTimeSystems.and.returnValue([{key: 'timestamp'}]);
            openmct.time.timeSystem.and.returnValue({key: 'timestamp'});

            unobserver = jasmine.createSpy('unobserver');
            openmct.objects.observe.and.returnValue(unobserver);

            composition = jasmine.createSpyObj('compositionCollection', [
                'on',
                'off',
                'load'
            ]);

            function notify(eventName, a, b) {
                composition.on.calls.all().filter(function (c) {
                    return c.args[0] === eventName;
                }).forEach(function (c) {
                    if (c.args[2]) { // listener w/ context.
                        c.args[1].call(c.args[2], a, b);
                    } else { // listener w/o context.
                        c.args[1](a, b);
                    }
                });
            }

            loader = {};
            loader.promise = new Promise(function (resolve, reject) {
                loader.resolve = resolve;
                loader.reject = reject;
            });

            composition.load.and.callFake(function () {
                setTimeout(function () {
                    notify('add', telemObjectA);
                    setTimeout(function () {
                        notify('add', telemObjectB);
                        setTimeout(function () {
                            loader.resolve();
                        });
                    });
                });

                return loader.promise;
            });
            openmct.composition.get.and.returnValue(composition);

            telemUnsubscribes = [];
            openmct.telemetry.subscribe.and.callFake(function () {
                const unsubscriber = jasmine.createSpy('unsubscriber' + telemUnsubscribes.length);
                telemUnsubscribes.push(unsubscriber);

                return unsubscriber;
            });

            openmct.telemetry.getMetadata.and.callFake(function (object) {
                return {
                    name: 'fake metadata manager',
                    object: object,
                    keys: ['timestamp', 'measurement']
                };
            });

            openmct.telemetry.getFormatMap.and.callFake(function (metadata) {
                expect(metadata.name).toBe('fake metadata manager');

                return {
                    metadata: metadata,
                    timestamp: {
                        parse: function (datum) {
                            return datum.t;
                        }
                    },
                    measurement: {
                        parse: function (datum) {
                            return datum.m;
                        }
                    }
                };
            });
            telemetryProvider = new SummaryWidgetTelemetryProvider(openmct);
        });

        it("supports subscription for summary widgets", function () {
            expect(telemetryProvider.supportsSubscribe(summaryWidgetObject))
                .toBe(true);
        });

        it("supports requests for summary widgets", function () {
            expect(telemetryProvider.supportsRequest(summaryWidgetObject))
                .toBe(true);
        });

        it("does not support other requests or subscriptions", function () {
            expect(telemetryProvider.supportsSubscribe(telemObjectA))
                .toBe(false);
            expect(telemetryProvider.supportsRequest(telemObjectA))
                .toBe(false);
        });

        it("Returns no results for basic requests", function () {
            return telemetryProvider.request(summaryWidgetObject, {})
                .then(function (result) {
                    expect(result).toEqual([]);
                });
        });

        it('provides realtime telemetry', function () {
            const callback = jasmine.createSpy('callback');
            telemetryProvider.subscribe(summaryWidgetObject, callback);

            return loader.promise.then(function () {
                return new Promise(function (resolve) {
                    setTimeout(resolve);
                });
            }).then(function () {
                expect(openmct.telemetry.subscribe.calls.count()).toBe(2);
                expect(openmct.telemetry.subscribe)
                    .toHaveBeenCalledWith(telemObjectA, jasmine.any(Function));
                expect(openmct.telemetry.subscribe)
                    .toHaveBeenCalledWith(telemObjectB, jasmine.any(Function));

                const aCallback = openmct.telemetry.subscribe.calls.all()[0].args[1];
                const bCallback = openmct.telemetry.subscribe.calls.all()[1].args[1];

                aCallback({
                    t: 123,
                    m: 25
                });
                expect(callback).not.toHaveBeenCalled();
                bCallback({
                    t: 123,
                    m: 25
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 123,
                    ruleLabel: "Don't Worry",
                    ruleName: "safe",
                    message: "It's Ok",
                    ruleIndex: 0,
                    backgroundColor: '#38761d',
                    textColor: '#ffffff',
                    borderColor: 'rgba(0,0,0,0)',
                    icon: 'a-ok'
                });

                aCallback({
                    t: 140,
                    m: 55
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 140,
                    ruleLabel: "Start Worrying",
                    ruleName: "A High",
                    message: "A is a little high...",
                    ruleIndex: 1,
                    backgroundColor: '#ffff00',
                    textColor: '#000000',
                    borderColor: 'rgba(1,1,0,0)',
                    icon: 'a-high'
                });

                bCallback({
                    t: 140,
                    m: -10
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 140,
                    ruleLabel: "WORRY!",
                    ruleName: "B Low",
                    message: "B is Low",
                    ruleIndex: 2,
                    backgroundColor: '#ff0000',
                    textColor: '#ff00ff',
                    borderColor: 'rgba(1,0,0,0)',
                    icon: 'b-low'
                });

                aCallback({
                    t: 160,
                    m: 25
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 160,
                    ruleLabel: "WORRY!",
                    ruleName: "B Low",
                    message: "B is Low",
                    ruleIndex: 2,
                    backgroundColor: '#ff0000',
                    textColor: '#ff00ff',
                    borderColor: 'rgba(1,0,0,0)',
                    icon: 'b-low'
                });

                bCallback({
                    t: 160,
                    m: 25
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 160,
                    ruleLabel: "Don't Worry",
                    ruleName: "safe",
                    message: "It's Ok",
                    ruleIndex: 0,
                    backgroundColor: '#38761d',
                    textColor: '#ffffff',
                    borderColor: 'rgba(0,0,0,0)',
                    icon: 'a-ok'
                });
            });
        });

        describe('providing lad telemetry', function () {
            let responseDatums;
            let resultsShouldBe;

            beforeEach(function () {
                openmct.telemetry.request.and.callFake(function (rObj, options) {
                    expect(rObj).toEqual(jasmine.any(Object));
                    expect(options).toEqual({
                        size: 1,
                        strategy: 'latest',
                        domain: 'timestamp'
                    });
                    expect(responseDatums[rObj.identifier.namespace]).toBeDefined();

                    return Promise.resolve([responseDatums[rObj.identifier.namespace]]);
                });
                responseDatums = {};

                resultsShouldBe = function (results) {
                    return telemetryProvider
                        .request(summaryWidgetObject, {
                            size: 1,
                            strategy: 'latest',
                            domain: 'timestamp'
                        })
                        .then(function (r) {
                            expect(r).toEqual(results);
                        });
                };
            });

            it("returns default when no rule matches", function () {
                responseDatums = {
                    a: {
                        t: 122,
                        m: 25
                    },
                    b: {
                        t: 111,
                        m: 25
                    }
                };

                return resultsShouldBe([{
                    timestamp: 122,
                    ruleLabel: "Don't Worry",
                    ruleName: "safe",
                    message: "It's Ok",
                    ruleIndex: 0,
                    backgroundColor: '#38761d',
                    textColor: '#ffffff',
                    borderColor: 'rgba(0,0,0,0)',
                    icon: 'a-ok'
                }]);
            });

            it("returns highest priority when multiple match", function () {
                responseDatums = {
                    a: {
                        t: 131,
                        m: 55
                    },
                    b: {
                        t: 139,
                        m: 5
                    }
                };

                return resultsShouldBe([{
                    timestamp: 139,
                    ruleLabel: "WORRY!",
                    ruleName: "B Low",
                    message: "B is Low",
                    ruleIndex: 2,
                    backgroundColor: '#ff0000',
                    textColor: '#ff00ff',
                    borderColor: 'rgba(1,0,0,0)',
                    icon: 'b-low'
                }]);
            });

            it("returns matching rule", function () {
                responseDatums = {
                    a: {
                        t: 144,
                        m: 55
                    },
                    b: {
                        t: 141,
                        m: 15
                    }
                };

                return resultsShouldBe([{
                    timestamp: 144,
                    ruleLabel: "Start Worrying",
                    ruleName: "A High",
                    message: "A is a little high...",
                    ruleIndex: 1,
                    backgroundColor: '#ffff00',
                    textColor: '#000000',
                    borderColor: 'rgba(1,1,0,0)',
                    icon: 'a-high'
                }]);
            });

        });

    });
});
