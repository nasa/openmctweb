/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import CouchDocument from "../couch/CouchDocument";
import CouchObjectQueue from "../couch/CouchObjectQueue";
import PouchDB from 'pouchdb';

const REV = "_rev";
const ID = "_id";
const HEARTBEAT = 50000;

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
        this.remoteCouch = options.remoteCouch;
        this.namespace = namespace;
        this.objectQueue = {};
        this.observers = {};

        this.pouchdb = new PouchDB(options.name);
        this.observeChanges();

        let replicateOptions = {live: true};
        this.pouchdb.replicate.to(this.remoteCouch, replicateOptions, this.logError);
        this.pouchdb.replicate.from(this.remoteCouch, replicateOptions, this.logError);
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

    observeChanges() {
        this.pouchdb.changes({
            since: 'now',
            live: true
          }).on('change', this.updateObject.bind(this));
    }

    observe(identifier, callback) {
        const keyString = this.openmct.objects.makeKeyString(identifier);
        this.observers[keyString] = this.observers[keyString] || [];
        this.observers[keyString].push(callback);

        return () => {
            this.observers[keyString] = this.observers[keyString].filter(observer => observer !== callback);
        };
    }

    logError(error) {
        console.log(error);
    }

    async updateObject(response) {
        const object = {};
        object.identifier = {
            namespace: this.namespace,
            key: response.id
        };
        let keyString = this.openmct.objects.makeKeyString(object.identifier);
        let observersForObject = this.observers[keyString];

        if (observersForObject) {
            observersForObject.forEach(async (observer) => {
                const updatedObject = await this.get(object.identifier);
                observer(updatedObject);
            });
        }
    }

    // Check the response to a create/update/delete request;
    // track the rev if it's valid, otherwise return false to
    // indicate that the request failed.
    // persist any queued objects
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

            this.objectQueue[key].updateRevision(response[REV]);

            return object;
        } else {
            return undefined;
        }
    }

    get(identifier, abortSignal) {
        return this.pouchdb.get(identifier.key).then(this.getModel.bind(this));
    }

    abortGetChanges() {
        if (this.controller) {
            this.controller.abort();
            this.controller = undefined;
        }

        return true;
    }

    getIntermediateResponse() {
        let intermediateResponse = {};
        intermediateResponse.promise = new Promise(function (resolve, reject) {
            intermediateResponse.resolve = resolve;
            intermediateResponse.reject = reject;
        });

        return intermediateResponse;
    }

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
        this.pouchdb.put(document).then((response) => {
            this.checkResponse(response, queued.intermediateResponse);
        });

        return intermediateResponse.promise;
    }

    updateQueued(key) {
        if (!this.objectQueue[key].pending) {
            this.objectQueue[key].pending = true;
            const queued = this.objectQueue[key].dequeue();
            let document = new CouchDocument(key, queued.model, this.objectQueue[key].rev);

            this.pouchdb.put(document).then((response) => {
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