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
        "../../src/actions/ImportAsJSONAction",
        "../../../entanglement/test/DomainObjectFactory"
    ],
    function (ImportAsJSONAction, domainObjectFactory) {

        xdescribe("The import JSON action", function () {

            var context = {};
            var action,
                exportService,
                identifierService,
                dialogService,
                openmct,
                mockDialog,
                compositionCapability,
                mockInstantiate,
                uniqueId,
                newObjects;

            beforeEach(function () {

                uniqueId = 0;
                newObjects = [];
                openmct = {
                    $injector: jasmine.createSpyObj('$injector', ['get']),
                    objects: {
                        makeKeyString: function (identifier) {
                            return identifier.key;
                        }
                    }
                };
                mockInstantiate = jasmine.createSpy('instantiate').and.callFake(
                    function (model, id) {
                        var config = {
                            "model": model,
                            "id": id,
                            "capabilities": {}
                        };
                        var locationCapability = {
                            setPrimaryLocation: jasmine.createSpy('setPrimaryLocation')
                                .and
                                .callFake(function (newLocation) {
                                    config.model.location = newLocation;
                                })
                        };
                        config.capabilities.location = locationCapability;
                        if (model.composition) {
                            var compCapability =
                                jasmine.createSpy('compCapability')
                                    .and.returnValue(model.composition);
                            compCapability.add = jasmine.createSpy('add')
                                .and.callFake(function (newObj) {
                                    config.model.composition.push(newObj.getId());
                                });
                            config.capabilities.composition = compCapability;
                        }

                        newObjects.push(domainObjectFactory(config));

                        return domainObjectFactory(config);
                    });
                openmct.$injector.get.and.returnValue(mockInstantiate);
                dialogService = jasmine.createSpyObj('dialogService',
                    [
                        'getUserInput',
                        'showBlockingMessage'
                    ]
                );
                identifierService = jasmine.createSpyObj('identifierService',
                    [
                        'generate'
                    ]
                );
                identifierService.generate.and.callFake(function () {
                    uniqueId++;

                    return uniqueId;
                });
                compositionCapability = jasmine.createSpy('compositionCapability');
                mockDialog = jasmine.createSpyObj("dialog", ["dismiss"]);
                dialogService.showBlockingMessage.and.returnValue(mockDialog);

                action = new ImportAsJSONAction(exportService, identifierService,
                    dialogService, openmct, context);
            });

            it("initializes happily", function () {
                expect(action).toBeDefined();
            });

            it("only applies to objects with composition capability", function () {
                var compDomainObject = domainObjectFactory({
                    name: 'compObject',
                    model: { name: 'compObject'},
                    capabilities: {"composition": compositionCapability}
                });
                var noCompDomainObject = domainObjectFactory();

                context.domainObject = compDomainObject;
                expect(ImportAsJSONAction.appliesTo(context)).toBe(true);
                context.domainObject = noCompDomainObject;
                expect(ImportAsJSONAction.appliesTo(context)).toBe(false);
            });

            it("displays error dialog on invalid file choice", function () {
                dialogService.getUserInput.and.returnValue(Promise.resolve(
                    {
                        selectFile: {
                            body: JSON.stringify({badKey: "INVALID"}),
                            name: "fileName"
                        }
                    })
                );

                action.perform();

                return new Promise(function (resolve, reject) {
                    setTimeout(resolve, 100);
                }).then(function () {
                    expect(dialogService.getUserInput).toHaveBeenCalled();
                    expect(dialogService.showBlockingMessage).toHaveBeenCalled();
                });
            });

            it("can import self-containing objects", function () {
                var compDomainObject = domainObjectFactory({
                    name: 'compObject',
                    model: { name: 'compObject'},
                    capabilities: {"composition": compositionCapability}
                });
                context.domainObject = compDomainObject;

                dialogService.getUserInput.and.returnValue(Promise.resolve(
                    {
                        selectFile: {
                            body: JSON.stringify({
                                "openmct": {
                                    "infiniteParent": {
                                        "composition": [{
                                            key: "infinteChild",
                                            namespace: ""
                                        }],
                                        "name": "1",
                                        "type": "folder",
                                        "modified": 1503598129176,
                                        "location": "mine",
                                        "persisted": 1503598129176
                                    },
                                    "infinteChild": {
                                        "composition": [{
                                            key: "infinteParent",
                                            namespace: ""
                                        }],
                                        "name": "2",
                                        "type": "folder",
                                        "modified": 1503598132428,
                                        "location": "infiniteParent",
                                        "persisted": 1503598132428
                                    }
                                },
                                "rootId": "infiniteParent"
                            }),
                            name: "fileName"
                        }
                    })
                );

                action.perform();

                return new Promise(function (resolve, reject) {
                    setTimeout(resolve, 100);
                }).then(function () {
                    expect(mockInstantiate.calls.count()).toEqual(2);
                });
            });

            it("assigns new ids to each imported object", function () {
                dialogService.getUserInput.and.returnValue(Promise.resolve(
                    {
                        selectFile: {
                            body: JSON.stringify({
                                "openmct": {
                                    "cce9f107-5060-4f55-8151-a00120f4222f": {
                                        "composition": [],
                                        "name": "test",
                                        "type": "folder",
                                        "modified": 1503596596639,
                                        "location": "mine",
                                        "persisted": 1503596596639
                                    }
                                },
                                "rootId": "cce9f107-5060-4f55-8151-a00120f4222f"
                            }),
                            name: "fileName"
                        }
                    })
                );

                action.perform();

                return new Promise(function (resolve, reject) {
                    setTimeout(resolve, 100);
                }).then(function () {
                    expect(mockInstantiate.calls.count()).toEqual(1);
                    expect(newObjects[0].getId()).toBe('1');
                });
            });

        });
    }
);
