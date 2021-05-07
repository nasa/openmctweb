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

import CouchDocument from "./CouchDocument";
import CouchObjectQueue from "./CouchObjectQueue";

const REV = "_rev";
const ID = "_id";
const HEARTBEAT = 50000;
const ALL_DOCS = "_all_docs?include_docs=true";

export default class CouchObjectProvider {
    // options {
    //      url: couchdb url,
    //      disableObserve: disable auto feed from couchdb to keep objects in sync,
    //      filter: selector to find objects to sync in couchdb
    //      }
    constructor(openmct, options, namespace) {
        options = this._normalize(options);
        this.openmct = openmct;
        this.url = options.url;
        this.namespace = namespace;
        this.objectQueue = {};
        this.observeEnabled = options.disableObserve !== true;
        this.observers = {};
        this.batchIds = [];

        if (this.observeEnabled) {
            this.observeObjectChanges(options.filter);
        }
    }

    //backwards compatibility, options used to be a url. Now it's an object
    _normalize(options) {
        if (typeof options === 'string') {
            return {
                url: options
            };
        }

        return options;
    }

    request(subPath, method, body, signal) {
        let fetchOptions = {
            method,
            body,
            signal
        };

        // stringify body if needed
        if (fetchOptions.body) {
            fetchOptions.body = JSON.stringify(fetchOptions.body);
            fetchOptions.headers = {
                "Content-Type": "application/json"
            };
        }

        return fetch(this.url + '/' + subPath, fetchOptions)
            .then(response => response.json())
            .then(function (response) {
                return response;
            }, function () {
                return undefined;
            });
    }

    /**
     * Check the response to a create/update/delete request;
     * track the rev if it's valid, otherwise return false to
     * indicate that the request failed.
     * persist any queued objects
     * @private
     */
    checkResponse(response, intermediateResponse) {
        let requestSuccess = false;
        const id = response ? response.id : undefined;
        let rev;

        if (response && response.ok) {
            rev = response.rev;
            requestSuccess = true;
        }

        intermediateResponse.resolve(requestSuccess);

        if (id) {
            if (!this.objectQueue[id]) {
                this.objectQueue[id] = new CouchObjectQueue(undefined, rev);
            }

            this.objectQueue[id].updateRevision(rev);
            this.objectQueue[id].pending = false;
            if (this.objectQueue[id].hasNext()) {
                this.updateQueued(id);
            }
        }
    }

    /**
     * @private
     */
    getModel(response) {
        if (response && response.model) {
            let key = response[ID];
            let object = response.model;
            object.identifier = {
                namespace: this.namespace,
                key: key
            };
            if (!this.objectQueue[key]) {
                this.objectQueue[key] = new CouchObjectQueue(undefined, response[REV]);
            }

            //Sometimes CouchDB returns the old rev which fetching the object if there is a document update in progress
            //Only update the rev if it's the first time we're getting the object from CouchDB. Subsequent revs should only be updated by updates.
            if (!this.objectQueue[key].pending && !this.objectQueue[key].rev) {
                this.objectQueue[key].updateRevision(response[REV]);
            }

            return object;
        } else {
            return undefined;
        }
    }

    get(identifier, abortSignal) {
        this.batchIds.push(identifier.key);

        if (this.bulkPromise === undefined) {
            this.bulkPromise = this.deferBatchedGet(abortSignal);
        }

        return this.bulkPromise
            .then((domainObjectMap) => {
                return domainObjectMap[identifier.key];
            });
    }

    /**
     * @private
     */
    deferBatchedGet(abortSignal) {
        // We until the next event loop cycle to "collect" all of the get
        // requests triggered in this iteration of the event loop

        return this.waitOneEventCycle().then(() => {
            let batchIds = this.batchIds;

            this.clearBatch();

            if (batchIds.length === 1) {
                let objectKey = batchIds[0];

                //If there's only one request, just do a regular get
                return this.request(objectKey, "GET", undefined, abortSignal)
                    .then(this.returnAsMap(objectKey));
            } else {
                return this.bulkGet(batchIds, abortSignal);
            }
        });
    }

    /**
     * @private
     */
    returnAsMap(objectKey) {
        return (result) => {
            let objectMap = {};
            objectMap[objectKey] = this.getModel(result);

            return objectMap;
        };
    }

    /**
     * @private
     */
    clearBatch() {
        this.batchIds = [];
        delete this.bulkPromise;
    }

    /**
     * @private
     */
    waitOneEventCycle() {
        return new Promise((resolve) => {
            setTimeout(resolve);
        });
    }

    /**
     * @private
     */
    bulkGet(ids, signal) {
        ids = this.removeDuplicates(ids);

        const query = {
            'keys': ids
        };

        return this.request(ALL_DOCS, 'POST', query, signal).then((response) => {
            if (response && response.rows !== undefined) {
                return response.rows.reduce((map, row) => {
                    if (row.doc !== undefined) {
                        map[row.key] = this.getModel(row.doc);
                    }

                    return map;
                }, {});
            } else {
                return {};
            }
        });
    }

    /**
     * @private
     */
    removeDuplicates(array) {
        return Array.from(new Set(array));
    }

    search(query, abortSignal) {
        const filter = {
            "selector": {
                "model": {
                    "name": {
                        "$regex": `(?i)${query}`
                    }
                }
            }
        };

        return this.getObjectsByFilter(filter, abortSignal);
    }

    async getObjectsByFilter(filter, abortSignal) {
        let objects = [];

        let url = `${this.url}/_find`;
        let body = {};

        if (filter) {
            body = JSON.stringify(filter);
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal: abortSignal,
            body
        });

        const reader = response.body.getReader();
        let completed = false;
        let decoder = new TextDecoder("utf-8");
        let decodedChunk = '';
        while (!completed) {
            const {done, value} = await reader.read();
            //done is true when we lose connection with the provider
            if (done) {
                completed = true;
            }

            if (value) {
                let chunk = new Uint8Array(value.length);
                chunk.set(value, 0);
                const partial = decoder.decode(chunk, {stream: !completed});
                decodedChunk = decodedChunk + partial;
            }
        }

        try {
            const json = JSON.parse(decodedChunk);
            if (json) {
                let docs = json.docs;
                docs.forEach(doc => {
                    let object = this.getModel(doc);
                    if (object) {
                        objects.push(object);
                    }
                });
            }
        } catch (e) {
            //do nothing
        }

        return objects;
    }

    observe(identifier, callback) {
        if (!this.observeEnabled) {
            return;
        }

        const keyString = this.openmct.objects.makeKeyString(identifier);
        this.observers[keyString] = this.observers[keyString] || [];
        this.observers[keyString].push(callback);

        return () => {
            this.observers[keyString] = this.observers[keyString].filter(observer => observer !== callback);
        };
    }

    /**
     * @private
     */
    abortGetChanges() {
        if (this.controller) {
            this.controller.abort();
            this.controller = undefined;
        }

        return true;
    }

    /**
     * @private
     */
    async observeObjectChanges(filter) {
        let intermediateResponse = this.getIntermediateResponse();

        if (!this.observeEnabled) {
            intermediateResponse.reject('Observe for changes is disabled');
        }

        const controller = new AbortController();
        const signal = controller.signal;

        if (this.controller) {
            this.abortGetChanges();
        }

        this.controller = controller;
        // feed=continuous maintains an indefinitely open connection with a keep-alive of HEARTBEAT milliseconds until this client closes the connection
        // style=main_only returns only the current winning revision of the document
        let url = `${this.url}/_changes?feed=continuous&style=main_only&heartbeat=${HEARTBEAT}`;

        let body = {};
        if (filter) {
            url = `${url}&filter=_selector`;
            body = JSON.stringify(filter);
        }

        const response = await fetch(url, {
            method: 'POST',
            signal,
            headers: {
                "Content-Type": 'application/json'
            },
            body
        });
        const reader = response.body.getReader();
        let completed = false;

        while (!completed) {
            const {done, value} = await reader.read();
            //done is true when we lose connection with the provider
            if (done) {
                completed = true;
            }

            if (value) {
                let chunk = new Uint8Array(value.length);
                chunk.set(value, 0);
                const decodedChunk = new TextDecoder("utf-8").decode(chunk).split('\n');
                if (decodedChunk.length && decodedChunk[decodedChunk.length - 1] === '') {
                    decodedChunk.forEach((doc, index) => {
                        try {
                            const object = JSON.parse(doc);
                            object.identifier = {
                                namespace: this.namespace,
                                key: object.id
                            };
                            let keyString = this.openmct.objects.makeKeyString(object.identifier);
                            let observersForObject = this.observers[keyString];

                            if (observersForObject) {
                                observersForObject.forEach(async (observer) => {
                                    const updatedObject = await this.get(object.identifier);
                                    observer(updatedObject);
                                });
                            }
                        } catch (e) {
                            //do nothing;
                        }
                    });
                }
            }

        }

        //We're done receiving from the provider. No more chunks.
        intermediateResponse.resolve(true);

        return intermediateResponse.promise;

    }

    /**
     * @private
     */
    getIntermediateResponse() {
        let intermediateResponse = {};
        intermediateResponse.promise = new Promise(function (resolve, reject) {
            intermediateResponse.resolve = resolve;
            intermediateResponse.reject = reject;
        });

        return intermediateResponse;
    }

    /**
     * @private
     */
    enqueueObject(key, model, intermediateResponse) {
        if (this.objectQueue[key]) {
            this.objectQueue[key].enqueue({
                model,
                intermediateResponse
            });
        } else {
            this.objectQueue[key] = new CouchObjectQueue({
                model,
                intermediateResponse
            });
        }
    }

    create(model) {
        let intermediateResponse = this.getIntermediateResponse();
        const key = model.identifier.key;
        this.enqueueObject(key, model, intermediateResponse);
        this.objectQueue[key].pending = true;
        const queued = this.objectQueue[key].dequeue();
        let document = new CouchDocument(key, queued.model);
        this.request(key, "PUT", document).then((response) => {
            this.checkResponse(response, queued.intermediateResponse);
        });

        return intermediateResponse.promise;
    }

    /**
     * @private
     */
    updateQueued(key) {
        if (!this.objectQueue[key].pending) {
            this.objectQueue[key].pending = true;
            const queued = this.objectQueue[key].dequeue();
            let document = new CouchDocument(key, queued.model, this.objectQueue[key].rev);
            this.request(key, "PUT", document).then((response) => {
                this.checkResponse(response, queued.intermediateResponse);
            });
        }
    }

    update(model) {
        let intermediateResponse = this.getIntermediateResponse();
        const key = model.identifier.key;
        this.enqueueObject(key, model, intermediateResponse);
        this.updateQueued(key);

        return intermediateResponse.promise;
    }
}
