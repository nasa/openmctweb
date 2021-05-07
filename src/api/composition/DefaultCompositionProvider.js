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
    'lodash',
    'objectUtils'
], function (
    _,
    objectUtils
) {
    /**
     * A CompositionProvider provides the underlying implementation of
     * composition-related behavior for certain types of domain object.
     *
     * By default, a composition provider will not support composition
     * modification.  You can add support for mutation of composition by
     * defining `add` and/or `remove` methods.
     *
     * If the composition of an object can change over time-- perhaps via
     * server updates or mutation via the add/remove methods, then one must
     * trigger events as necessary.
     *
     * @interface CompositionProvider
     * @memberof module:openmct
     */

    function DefaultCompositionProvider(publicAPI, compositionAPI) {
        this.publicAPI = publicAPI;
        this.listeningTo = {};
        this.onMutation = this.onMutation.bind(this);

        this.cannotContainItself = this.cannotContainItself.bind(this);

        compositionAPI.addPolicy(this.cannotContainItself);
    }

    /**
     * @private
     */
    DefaultCompositionProvider.prototype.cannotContainItself = function (parent, child) {
        return !(parent.identifier.namespace === child.identifier.namespace
            && parent.identifier.key === child.identifier.key);
    };

    /**
     * Check if this provider should be used to load composition for a
     * particular domain object.
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to check
     * @returns {boolean} true if this provider can provide
     *          composition for a given domain object
     * @memberof module:openmct.CompositionProvider#
     * @method appliesTo
     */
    DefaultCompositionProvider.prototype.appliesTo = function (domainObject) {
        return Boolean(domainObject.composition);
    };

    /**
     * Load any domain objects contained in the composition of this domain
     * object.
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        for which to load composition
     * @returns {Promise.<Array.<module:openmct.Identifier>>} a promise for
     *          the Identifiers in this composition
     * @memberof module:openmct.CompositionProvider#
     * @method load
     */
    DefaultCompositionProvider.prototype.load = function (domainObject) {
        return Promise.all(domainObject.composition);
    };

    /**
     * Attach listeners for changes to the composition of a given domain object.
     * Supports `add` and `remove` events.
     *
     * @param {module:openmct.DomainObject} domainObject to listen to
     * @param String event the event to bind to, either `add` or `remove`.
     * @param Function callback callback to invoke when event is triggered.
     * @param [context] context to use when invoking callback.
     */
    DefaultCompositionProvider.prototype.on = function (
        domainObject,
        event,
        callback,
        context
    ) {
        this.establishTopicListener();

        const keyString = objectUtils.makeKeyString(domainObject.identifier);
        let objectListeners = this.listeningTo[keyString];

        if (!objectListeners) {
            objectListeners = this.listeningTo[keyString] = {
                add: [],
                remove: [],
                reorder: [],
                composition: [].slice.apply(domainObject.composition)
            };
        }

        objectListeners[event].push({
            callback: callback,
            context: context
        });
    };

    /**
     * Remove a listener that was previously added for a given domain object.
     * event name, callback, and context must be the same as when the listener
     * was originally attached.
     *
     * @param {module:openmct.DomainObject} domainObject to remove listener for
     * @param String event event to stop listening to: `add` or `remove`.
     * @param Function callback callback to remove.
     * @param [context] context of callback to remove.
     */
    DefaultCompositionProvider.prototype.off = function (
        domainObject,
        event,
        callback,
        context
    ) {
        const keyString = objectUtils.makeKeyString(domainObject.identifier);
        const objectListeners = this.listeningTo[keyString];

        const index = objectListeners[event].findIndex(l => {
            return l.callback === callback && l.context === context;
        });

        objectListeners[event].splice(index, 1);
        if (!objectListeners.add.length && !objectListeners.remove.length && !objectListeners.reorder.length) {
            delete this.listeningTo[keyString];
        }
    };

    /**
     * Remove a domain object from another domain object's composition.
     *
     * This method is optional; if not present, adding to a domain object's
     * composition using this provider will be disallowed.
     *
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        which should have its composition modified
     * @param {module:openmct.DomainObject} child the domain object to remove
     * @memberof module:openmct.CompositionProvider#
     * @method remove
     */
    DefaultCompositionProvider.prototype.remove = function (domainObject, childId) {
        let composition = domainObject.composition.filter(function (child) {
            return !(childId.namespace === child.namespace
                && childId.key === child.key);
        });

        this.publicAPI.objects.mutate(domainObject, 'composition', composition);
    };

    /**
     * Add a domain object to another domain object's composition.
     *
     * This method is optional; if not present, adding to a domain object's
     * composition using this provider will be disallowed.
     *
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        which should have its composition modified
     * @param {module:openmct.DomainObject} child the domain object to add
     * @memberof module:openmct.CompositionProvider#
     * @method add
     */
    DefaultCompositionProvider.prototype.add = function (parent, childId) {
        if (!this.includes(parent, childId)) {
            parent.composition.push(childId);
            this.publicAPI.objects.mutate(parent, 'composition', parent.composition);
        }
    };

    /**
     * @private
     */
    DefaultCompositionProvider.prototype.includes = function (parent, childId) {
        return parent.composition.some(composee =>
            this.publicAPI.objects.areIdsEqual(composee, childId));
    };

    DefaultCompositionProvider.prototype.reorder = function (domainObject, oldIndex, newIndex) {
        let newComposition = domainObject.composition.slice();
        let removeId = oldIndex > newIndex ? oldIndex + 1 : oldIndex;
        let insertPosition = oldIndex < newIndex ? newIndex + 1 : newIndex;
        //Insert object in new position
        newComposition.splice(insertPosition, 0, domainObject.composition[oldIndex]);
        newComposition.splice(removeId, 1);

        let reorderPlan = [{
            oldIndex,
            newIndex
        }];

        if (oldIndex > newIndex) {
            for (let i = newIndex; i < oldIndex; i++) {
                reorderPlan.push({
                    oldIndex: i,
                    newIndex: i + 1
                });
            }
        } else {
            for (let i = oldIndex + 1; i <= newIndex; i++) {
                reorderPlan.push({
                    oldIndex: i,
                    newIndex: i - 1
                });
            }
        }

        this.publicAPI.objects.mutate(domainObject, 'composition', newComposition);

        let id = objectUtils.makeKeyString(domainObject.identifier);
        const listeners = this.listeningTo[id];

        if (!listeners) {
            return;
        }

        listeners.reorder.forEach(notify);

        function notify(listener) {
            if (listener.context) {
                listener.callback.call(listener.context, reorderPlan);
            } else {
                listener.callback(reorderPlan);
            }
        }
    };

    /**
     * Listens on general mutation topic, using injector to fetch to avoid
     * circular dependencies.
     *
     * @private
     */
    DefaultCompositionProvider.prototype.establishTopicListener = function () {
        if (this.topicListener) {
            return;
        }

        this.publicAPI.objects.eventEmitter.on('mutation', this.onMutation);
        this.topicListener = () => {
            this.publicAPI.objects.eventEmitter.off('mutation', this.onMutation);
        };
    };

    /**
     * Handles mutation events.  If there are active listeners for the mutated
     * object, detects changes to composition and triggers necessary events.
     *
     * @private
     */
    DefaultCompositionProvider.prototype.onMutation = function (oldDomainObject) {
        const id = objectUtils.makeKeyString(oldDomainObject.identifier);
        const listeners = this.listeningTo[id];

        if (!listeners) {
            return;
        }

        const oldComposition = listeners.composition.map(objectUtils.makeKeyString);
        const newComposition = oldDomainObject.composition.map(objectUtils.makeKeyString);

        const added = _.difference(newComposition, oldComposition).map(objectUtils.parseKeyString);
        const removed = _.difference(oldComposition, newComposition).map(objectUtils.parseKeyString);

        function notify(value) {
            return function (listener) {
                if (listener.context) {
                    listener.callback.call(listener.context, value);
                } else {
                    listener.callback(value);
                }
            };
        }

        listeners.composition = newComposition.map(objectUtils.parseKeyString);

        added.forEach(function (addedChild) {
            listeners.add.forEach(notify(addedChild));
        });

        removed.forEach(function (removedChild) {
            listeners.remove.forEach(notify(removedChild));
        });

    };

    return DefaultCompositionProvider;
});
