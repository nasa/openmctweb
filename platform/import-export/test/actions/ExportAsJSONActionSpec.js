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

define(
    [
        "../../src/actions/ExportAsJSONAction",
        "../../../entanglement/test/DomainObjectFactory",
        "../../../../src/MCT",
        '../../../../src/adapter/capabilities/AdapterCapability'
    ],
    function (ExportAsJSONAction, domainObjectFactory, MCT, AdapterCapability) {

        xdescribe("The export JSON action", function () {

            var context,
                action,
                exportService,
                identifierService,
                typeService,
                openmct,
                policyService,
                mockType,
                mockObjectProvider,
                exportedTree;

            beforeEach(function () {
                openmct = new MCT();
                mockObjectProvider = {
                    objects: {},
                    get: function (id) {
                        return Promise.resolve(mockObjectProvider.objects[id.key]);
                    }
                };
                openmct.objects.addProvider('', mockObjectProvider);

                exportService = jasmine.createSpyObj('exportService',
                    ['exportJSON']);
                identifierService = jasmine.createSpyObj('identifierService',
                    ['generate']);
                policyService = jasmine.createSpyObj('policyService',
                    ['allow']);
                mockType = jasmine.createSpyObj('type', ['hasFeature']);
                typeService = jasmine.createSpyObj('typeService', [
                    'getType'
                ]);

                mockType.hasFeature.and.callFake(function (feature) {
                    return feature === 'creation';
                });

                typeService.getType.and.returnValue(mockType);

                context = {};
                context.domainObject = domainObjectFactory(
                    {
                        name: 'test',
                        id: 'someID',
                        capabilities: {
                            'adapter': {
                                invoke: invokeAdapter
                            }
                        }
                    });
                identifierService.generate.and.returnValue('brandNewId');
                exportService.exportJSON.and.callFake(function (tree, options) {
                    exportedTree = tree;
                });
                policyService.allow.and.callFake(function (capability, type) {
                    return type.hasFeature(capability);
                });

                action = new ExportAsJSONAction(openmct, exportService, policyService,
                    identifierService, typeService, context);
            });

            function invokeAdapter() {
                var newStyleObject = new AdapterCapability(context.domainObject).invoke();

                return newStyleObject;
            }

            it("initializes happily", function () {
                expect(action).toBeDefined();
            });

            it("doesn't export non-creatable objects in tree", function () {
                var nonCreatableType = {
                    hasFeature:
                        function (feature) {
                            return feature !== 'creation';
                        }
                };

                typeService.getType.and.returnValue(nonCreatableType);

                var parent = domainObjectFactory({
                    name: 'parent',
                    model: {
                        name: 'parent',
                        location: 'ROOT',
                        composition: ['childId']
                    },
                    id: 'parentId',
                    capabilities: {
                        'adapter': {
                            invoke: invokeAdapter
                        }
                    }
                });

                var child = {
                    identifier: {
                        namespace: '',
                        key: 'childId'
                    },
                    name: 'child',
                    location: 'parentId'
                };
                context.domainObject = parent;
                addChild(child);

                action.perform();

                return new Promise(function (resolve, reject) {
                    setTimeout(resolve, 100);
                }).then(function () {
                    expect(Object.keys(action.tree).length).toBe(1);
                    expect(Object.prototype.hasOwnProperty.call(action.tree, "parentId"))
                        .toBeTruthy();
                });
            });

            it("can export self-containing objects", function () {
                var parent = domainObjectFactory({
                    name: 'parent',
                    model: {
                        name: 'parent',
                        location: 'ROOT',
                        composition: ['infiniteChildId']
                    },
                    id: 'infiniteParentId',
                    capabilities: {
                        'adapter': {
                            invoke: invokeAdapter
                        }
                    }
                });

                var child = {
                    identifier: {
                        namespace: '',
                        key: 'infiniteChildId'
                    },
                    name: 'child',
                    location: 'infiniteParentId',
                    composition: ['infiniteParentId']
                };
                addChild(child);

                context.domainObject = parent;

                action.perform();

                return new Promise(function (resolve, reject) {
                    setTimeout(resolve, 100);
                }).then(function () {
                    expect(Object.keys(action.tree).length).toBe(2);
                    expect(Object.prototype.hasOwnProperty.call(action.tree, "infiniteParentId"))
                        .toBeTruthy();
                    expect(Object.prototype.hasOwnProperty.call(action.tree, "infiniteChildId"))
                        .toBeTruthy();
                });
            });

            it("exports links to external objects as new objects", function () {
                var parent = domainObjectFactory({
                    name: 'parent',
                    model: {
                        name: 'parent',
                        composition: ['externalId'],
                        location: 'ROOT'
                    },
                    id: 'parentId',
                    capabilities: {
                        'adapter': {
                            invoke: invokeAdapter
                        }
                    }
                });

                var externalObject = {
                    name: 'external',
                    location: 'outsideOfTree',
                    identifier: {
                        namespace: '',
                        key: 'externalId'
                    }
                };
                addChild(externalObject);

                context.domainObject = parent;

                return new Promise (function (resolve) {
                    action.perform();
                    setTimeout(resolve, 100);
                }).then(function () {
                    expect(Object.keys(action.tree).length).toBe(2);
                    expect(Object.prototype.hasOwnProperty.call(action.tree, "parentId"))
                        .toBeTruthy();
                    expect(Object.prototype.hasOwnProperty.call(action.tree, "brandNewId"))
                        .toBeTruthy();
                    expect(action.tree.brandNewId.location).toBe('parentId');
                });
            });

            it("exports object tree in the correct format", function () {
                action.perform();

                return new Promise(function (resolve, reject) {
                    setTimeout(resolve, 100);
                }).then(function () {
                    expect(Object.keys(exportedTree).length).toBe(2);
                    expect(Object.prototype.hasOwnProperty.call(exportedTree, "openmct")).toBeTruthy();
                    expect(Object.prototype.hasOwnProperty.call(exportedTree, "rootId")).toBeTruthy();
                });
            });

            function addChild(object) {
                mockObjectProvider.objects[object.identifier.key] = object;
            }
        });
    }
);
