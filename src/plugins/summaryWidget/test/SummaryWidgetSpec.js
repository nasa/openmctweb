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

define(['../src/SummaryWidget', 'zepto'], function (SummaryWidget, $) {
    xdescribe('The Summary Widget', function () {
        let summaryWidget;
        let mockDomainObject;
        let mockOldDomainObject;
        let mockOpenMCT;
        let mockObjectService;
        let mockStatusCapability;
        let mockComposition;
        let mockContainer;
        let listenCallback;
        let listenCallbackSpy;

        beforeEach(function () {
            mockDomainObject = {
                identifier: {
                    key: 'testKey',
                    namespace: 'testNamespace'
                },
                name: 'testName',
                composition: [],
                configuration: {}
            };
            mockComposition = jasmine.createSpyObj('composition', [
                'on',
                'off',
                'load'
            ]);
            mockStatusCapability = jasmine.createSpyObj('statusCapability', [
                'get',
                'listen',
                'triggerCallback'
            ]);

            listenCallbackSpy = jasmine.createSpy('listenCallbackSpy', function () {});
            mockStatusCapability.get.and.returnValue([]);
            mockStatusCapability.listen.and.callFake(function (callback) {
                listenCallback = callback;

                return listenCallbackSpy;
            });
            mockStatusCapability.triggerCallback.and.callFake(function () {
                listenCallback(['editing']);
            });

            mockOldDomainObject = {};
            mockOldDomainObject.getCapability = jasmine.createSpy('capability');
            mockOldDomainObject.getCapability.and.returnValue(mockStatusCapability);

            mockObjectService = {};
            mockObjectService.getObjects = jasmine.createSpy('objectService');
            mockObjectService.getObjects.and.returnValue(new Promise(function (resolve, reject) {
                resolve({
                    'testNamespace:testKey': mockOldDomainObject
                });
            }));
            mockOpenMCT = jasmine.createSpyObj('openmct', [
                '$injector',
                'composition',
                'objects'
            ]);
            mockOpenMCT.$injector.get = jasmine.createSpy('get');
            mockOpenMCT.$injector.get.and.returnValue(mockObjectService);
            mockOpenMCT.composition = jasmine.createSpyObj('composition', [
                'get',
                'on'
            ]);
            mockOpenMCT.composition.get.and.returnValue(mockComposition);
            mockOpenMCT.objects.mutate = jasmine.createSpy('mutate');
            mockOpenMCT.objects.observe = jasmine.createSpy('observe');
            mockOpenMCT.objects.observe.and.returnValue(function () {});

            summaryWidget = new SummaryWidget(mockDomainObject, mockOpenMCT);
            mockContainer = document.createElement('div');
            summaryWidget.show(mockContainer);
        });

        it('queries with legacyId', function () {
            expect(mockObjectService.getObjects).toHaveBeenCalledWith(['testNamespace:testKey']);
        });

        it('adds its DOM element to the view', function () {
            expect(mockContainer.getElementsByClassName('w-summary-widget').length).toBeGreaterThan(0);
        });

        it('initialzes a default rule', function () {
            expect(mockDomainObject.configuration.ruleConfigById.default).toBeDefined();
            expect(mockDomainObject.configuration.ruleOrder).toEqual(['default']);
        });

        it('builds rules and rule placeholders in view from configuration', function () {
            expect($('.l-widget-rule', summaryWidget.ruleArea).get().length).toEqual(2);
        });

        it('allows initializing a new rule with a particular identifier', function () {
            summaryWidget.initRule('rule0', 'Rule');
            expect(mockDomainObject.configuration.ruleConfigById.rule0).toBeDefined();
        });

        it('allows adding a new rule with a unique identifier to the configuration and view', function () {
            summaryWidget.addRule();
            expect(mockDomainObject.configuration.ruleOrder.length).toEqual(2);
            mockDomainObject.configuration.ruleOrder.forEach(function (ruleId) {
                expect(mockDomainObject.configuration.ruleConfigById[ruleId]).toBeDefined();
            });
            summaryWidget.addRule();
            expect(mockDomainObject.configuration.ruleOrder.length).toEqual(3);
            mockDomainObject.configuration.ruleOrder.forEach(function (ruleId) {
                expect(mockDomainObject.configuration.ruleConfigById[ruleId]).toBeDefined();
            });
            expect($('.l-widget-rule', summaryWidget.ruleArea).get().length).toEqual(6);
        });

        it('allows duplicating a rule from source configuration', function () {
            const sourceConfig = JSON.parse(JSON.stringify(mockDomainObject.configuration.ruleConfigById.default));
            summaryWidget.duplicateRule(sourceConfig);
            expect(Object.keys(mockDomainObject.configuration.ruleConfigById).length).toEqual(2);
        });

        it('does not duplicate an existing rule in the configuration', function () {
            summaryWidget.initRule('default', 'Default');
            expect(Object.keys(mockDomainObject.configuration.ruleConfigById).length).toEqual(1);
        });

        it('uses mutate when updating the domain object only when in edit mode', function () {
            summaryWidget.editing = true;
            summaryWidget.updateDomainObject();
            expect(mockOpenMCT.objects.mutate).toHaveBeenCalled();
        });

        it('shows configuration interfaces when in edit mode, and hides them otherwise', function () {
            setTimeout(function () {
                summaryWidget.onEdit([]);
                expect(summaryWidget.editing).toEqual(false);
                expect(summaryWidget.ruleArea.css('display')).toEqual('none');
                expect(summaryWidget.testDataArea.css('display')).toEqual('none');
                expect(summaryWidget.addRuleButton.css('display')).toEqual('none');
                summaryWidget.onEdit(['editing']);
                expect(summaryWidget.editing).toEqual(true);
                expect(summaryWidget.ruleArea.css('display')).not.toEqual('none');
                expect(summaryWidget.testDataArea.css('display')).not.toEqual('none');
                expect(summaryWidget.addRuleButton.css('display')).not.toEqual('none');
            }, 100);
        });

        it('unregisters any registered listeners on a destroy', function () {
            setTimeout(function () {
                summaryWidget.destroy();
                expect(listenCallbackSpy).toHaveBeenCalled();
            }, 100);
        });

        it('allows reorders of rules', function () {
            summaryWidget.initRule('rule0');
            summaryWidget.initRule('rule1');
            summaryWidget.domainObject.configuration.ruleOrder = ['default', 'rule0', 'rule1'];
            summaryWidget.reorder({
                draggingId: 'rule1',
                dropTarget: 'default'
            });
            expect(summaryWidget.domainObject.configuration.ruleOrder).toEqual(['default', 'rule1', 'rule0']);
        });

        it('adds hyperlink to the widget button and sets newTab preference', function () {
            summaryWidget.addHyperlink('https://www.nasa.gov', 'newTab');

            const widgetButton = $('#widget', mockContainer);

            expect(widgetButton.attr('href')).toEqual('https://www.nasa.gov');
            expect(widgetButton.attr('target')).toEqual('_blank');
        });
    });
});
