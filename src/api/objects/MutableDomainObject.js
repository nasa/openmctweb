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
import _ from 'lodash';
import utils from './object-utils.js';
import EventEmitter from 'EventEmitter';

const ANY_OBJECT_EVENT = 'mutation';

/**
 * Wraps a domain object to keep its model synchronized with other instances of the same object.
 *
 * Creating a MutableDomainObject will automatically register listeners to keep its model in sync. As such, developers
 * should be careful to destroy MutableDomainObject in order to avoid memory leaks.
 *
 * All Open MCT API functions that provide objects will provide MutableDomainObjects where possible, except
 * `openmct.objects.get()`, and will manage that object's lifecycle for you. Calling `openmct.objects.getMutable()`
 * will result in the creation of a new MutableDomainObject and you will be responsible for destroying it
 * (via openmct.objects.destroy) when you're done with it.
 *
 * @typedef MutableDomainObject
 * @memberof module:openmct
 */
class MutableDomainObject {
    constructor(eventEmitter) {
        Object.defineProperties(this, {
            _globalEventEmitter: {
                value: eventEmitter,
                // Property should not be serialized
                enumerable: false
            },
            _instanceEventEmitter: {
                value: new EventEmitter(),
                // Property should not be serialized
                enumerable: false
            },
            _observers: {
                value: [],
                // Property should not be serialized
                enumerable: false
            },
            isMutable: {
                value: true,
                // Property should not be serialized
                enumerable: false
            }
        });
    }
    $observe(path, callback) {
        let fullPath = qualifiedEventName(this, path);
        let eventOff =
            this._globalEventEmitter.off.bind(this._globalEventEmitter, fullPath, callback);

        this._globalEventEmitter.on(fullPath, callback);
        this._observers.push(eventOff);

        return eventOff;
    }
    $set(path, value) {
        _.set(this, path, value);

        if (path !== 'persisted' && path !== 'modified') {
            _.set(this, 'modified', Date.now());
        }

        //Emit secret synchronization event first, so that all objects are in sync before subsequent events fired.
        this._globalEventEmitter.emit(qualifiedEventName(this, '$_synchronize_model'), this);

        //Emit a general "any object" event
        this._globalEventEmitter.emit(ANY_OBJECT_EVENT, this);
        //Emit wildcard event, with path so that callback knows what changed
        this._globalEventEmitter.emit(qualifiedEventName(this, '*'), this, path, value);

        //Emit events specific to properties affected
        let parentPropertiesList = path.split('.');
        for (let index = parentPropertiesList.length; index > 0; index--) {
            let parentPropertyPath = parentPropertiesList.slice(0, index).join('.');
            this._globalEventEmitter.emit(qualifiedEventName(this, parentPropertyPath), _.get(this, parentPropertyPath));
        }

        //TODO: Emit events for listeners of child properties when parent changes.
        // Do it at observer time - also register observers for parent attribute path.
    }

    $refresh(model) {
        //TODO: Currently we are updating the entire object.
        // In the future we could update a specific property of the object using the 'path' parameter.
        this._globalEventEmitter.emit(qualifiedEventName(this, '$_synchronize_model'), model);

        //Emit wildcard event, with path so that callback knows what changed
        this._globalEventEmitter.emit(qualifiedEventName(this, '*'), this);
    }

    $on(event, callback) {
        this._instanceEventEmitter.on(event, callback);

        return () => this._instanceEventEmitter.off(event, callback);
    }
    $destroy() {
        while (this._observers.length > 0) {
            const observer = this._observers.pop();
            observer();
        }

        this._instanceEventEmitter.emit('$_destroy');
    }

    static createMutable(object, mutationTopic) {
        let mutable = Object.create(new MutableDomainObject(mutationTopic));
        Object.assign(mutable, object);

        mutable.$observe('$_synchronize_model', (updatedObject) => {
            let clone = JSON.parse(JSON.stringify(updatedObject));
            let deleted = _.difference(Object.keys(mutable), Object.keys(updatedObject));
            deleted.forEach((propertyName) => delete mutable[propertyName]);
            Object.assign(mutable, clone);
        });

        return mutable;
    }

    static mutateObject(object, path, value) {
        _.set(object, path, value);
        _.set(object, 'modified', Date.now());
    }
}

function qualifiedEventName(object, eventName) {
    let keystring = utils.makeKeyString(object.identifier);

    return [keystring, eventName].join(':');
}

export default MutableDomainObject;
