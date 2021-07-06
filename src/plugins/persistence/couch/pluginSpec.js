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
import CouchPlugin from './plugin.js';
import {
    createOpenMct,
    resetApplicationState, spyOnBuiltins
} from 'utils/testing';

describe('the plugin', () => {
    let openmct;
    let provider;
    let testPath = '/test/db';
    let options;
    let mockIdentifierService;
    let mockDomainObject;

    beforeEach((done) => {
        spyOnBuiltins(['fetch'], window);

        mockDomainObject = {
            identifier: {
                namespace: '',
                key: 'some-value'
            },
            type: 'mock-type',
            modified: 0
        };
        options = {
            url: testPath,
            filter: {},
            disableObserve: true
        };
        openmct = createOpenMct();

        openmct.$injector = jasmine.createSpyObj('$injector', ['get']);
        mockIdentifierService = jasmine.createSpyObj(
            'identifierService',
            ['parse']
        );
        mockIdentifierService.parse.and.returnValue({
            getSpace: () => {
                return 'mct';
            }
        });

        openmct.$injector.get.and.returnValue(mockIdentifierService);

        openmct.install(new CouchPlugin(options));

        openmct.types.addType('mock-type', {creatable: true});

        openmct.on('start', done);
        openmct.startHeadless();

        provider = openmct.objects.getProvider(mockDomainObject.identifier);
        spyOn(provider, 'get').and.callThrough();
        spyOn(provider, 'create').and.callThrough();
        spyOn(provider, 'update').and.callThrough();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe('the provider', () => {
        let mockPromise;
        beforeEach(() => {
            mockPromise = Promise.resolve({
                json: () => {
                    return {
                        ok: true,
                        _id: 'some-value',
                        id: 'some-value',
                        _rev: 1,
                        model: {}
                    };
                }
            });
            fetch.and.returnValue(mockPromise);
        });

        it('gets an object', () => {
            return openmct.objects.get(mockDomainObject.identifier).then((result) => {
                expect(result.identifier.key).toEqual(mockDomainObject.identifier.key);
            });
        });

        it('creates an object', () => {
            return openmct.objects.save(mockDomainObject).then((result) => {
                expect(provider.create).toHaveBeenCalled();
                expect(result).toBeTrue();
            });
        });

        it('updates an object', (done) => {
            return openmct.objects.save(mockDomainObject).then((result) => {
                expect(result).toBeTrue();
                expect(provider.create).toHaveBeenCalled();

                //Set modified timestamp it detects a change and persists the updated model.
                mockDomainObject.modified = Date.now();

                return openmct.objects.save(mockDomainObject).then((updatedResult) => {
                    expect(updatedResult).toBeTrue();
                    expect(provider.update).toHaveBeenCalled();
                    done();
                });
            });
        });
    });
    describe('batches requests', () => {
        let mockPromise;
        beforeEach(() => {
            mockPromise = Promise.resolve({
                json: () => {
                    return {
                        total_rows: 0,
                        rows: []
                    };
                }
            });
            fetch.and.returnValue(mockPromise);
        });
        it('for multiple simultaneous gets', () => {
            const objectIds = [
                {
                    namespace: '',
                    key: 'object-1'
                }, {
                    namespace: '',
                    key: 'object-2'
                }, {
                    namespace: '',
                    key: 'object-3'
                }
            ];

            const getAllObjects = Promise.all(
                objectIds.map((identifier) =>
                    openmct.objects.get(identifier)
                ));

            return getAllObjects.then(() => {
                const requestUrl = fetch.calls.mostRecent().args[0];
                const requestMethod = fetch.calls.mostRecent().args[1].method;

                expect(fetch).toHaveBeenCalledTimes(1);
                expect(requestUrl.includes('_all_docs')).toBeTrue();
                expect(requestMethod).toEqual('POST');
            });
        });

        it('but not for single gets', () => {
            const objectId = {
                namespace: '',
                key: 'object-1'
            };

            const getObject = openmct.objects.get(objectId);

            return getObject.then(() => {
                const requestUrl = fetch.calls.mostRecent().args[0];
                const requestMethod = fetch.calls.mostRecent().args[1].method;

                expect(fetch).toHaveBeenCalledTimes(1);
                expect(requestUrl.endsWith(`${objectId.key}`)).toBeTrue();
                expect(requestMethod).toEqual('GET');
            });
        });
    });
    describe('implements server-side search', () => {
        let mockPromise;
        beforeEach(() => {
            mockPromise = Promise.resolve({
                body: {
                    getReader() {
                        return {
                            read() {
                                return Promise.resolve({
                                    done: true,
                                    value: undefined
                                });
                            }
                        };
                    }
                }
            });
            fetch.and.returnValue(mockPromise);
        });

        it("using Couch's 'find' endpoint", () => {
            return Promise.all(openmct.objects.search('test')).then(() => {
                const requestUrl = fetch.calls.mostRecent().args[0];

                expect(fetch).toHaveBeenCalled();
                expect(requestUrl.endsWith('_find')).toBeTrue();
            });
        });

        it("and supports search by object name", () => {
            return Promise.all(openmct.objects.search('test')).then(() => {
                const requestPayload = JSON.parse(fetch.calls.mostRecent().args[1].body);

                expect(requestPayload).toBeDefined();
                expect(requestPayload.selector.model.name.$regex).toEqual('(?i)test');
            });
        });

    });
});
