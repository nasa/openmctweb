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
    'lodash'
], function (
    _
) {
    /**
     * A CompositionCollection represents the list of domain objects contained
     * by another domain object. It provides methods for loading this
     * list asynchronously, modifying this list, and listening for changes to
     * this list.
     *
     * Usage:
     * ```javascript
     *  var myViewComposition = MCT.composition.get(myViewObject);
     *  myViewComposition.on('add', addObjectToView);
     *  myViewComposition.on('remove', removeObjectFromView);
     *  myViewComposition.load(); // will trigger `add` for all loaded objects.
     *  ```
     *
     * @interface CompositionCollection
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        whose composition will be contained
     * @param {module:openmct.CompositionProvider} provider the provider
     *        to use to retrieve other domain objects
     * @param {module:openmct.CompositionAPI} api the composition API, for
     *        policy checks
     * @memberof module:openmct
     */
    function CompositionCollection(domainObject, provider, publicAPI) {
        this.domainObject = domainObject;
        this.provider = provider;
        this.publicAPI = publicAPI;
        this.listeners = {
            add: [],
            remove: [],
            load: [],
            reorder: []
        };
        this.onProviderAdd = this.onProviderAdd.bind(this);
        this.onProviderRemove = this.onProviderRemove.bind(this);
        this.mutables = {};

        if (this.domainObject.isMutable) {
            this.returnMutables = true;
            let unobserve = this.domainObject.$on('$_destroy', () => {
                Object.values(this.mutables).forEach(mutable => {
                    this.publicAPI.objects.destroyMutable(mutable);
                });
                unobserve();
            });
        }
    }

    /**
     * Listen for changes to this composition.  Supports 'add', 'remove', and
     * 'load' events.
     *
     * @param event event to listen for, either 'add', 'remove' or 'load'.
     * @param callback to trigger when event occurs.
     * @param [context] context to use when invoking callback, optional.
     */
    CompositionCollection.prototype.on = function (event, callback, context) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by composition: ' + event);
        }

        if (this.provider.on && this.provider.off) {
            if (event === 'add') {
                this.provider.on(
                    this.domainObject,
                    'add',
                    this.onProviderAdd,
                    this
                );
            }

            if (event === 'remove') {
                this.provider.on(
                    this.domainObject,
                    'remove',
                    this.onProviderRemove,
                    this
                );
            }

            if (event === 'reorder') {
                this.provider.on(
                    this.domainObject,
                    'reorder',
                    this.onProviderReorder,
                    this
                );
            }
        }

        this.listeners[event].push({
            callback: callback,
            context: context
        });
    };

    /**
     * Remove a listener.  Must be called with same exact parameters as
     * `off`.
     *
     * @param event
     * @param callback
     * @param [context]
     */

    CompositionCollection.prototype.off = function (event, callback, context) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by composition: ' + event);
        }

        const index = this.listeners[event].findIndex(l => {
            return l.callback === callback && l.context === context;
        });

        if (index === -1) {
            throw new Error('Tried to remove a listener that does not exist');
        }

        this.listeners[event].splice(index, 1);
        if (this.listeners[event].length === 0) {
            this._destroy();

            // Remove provider listener if this is the last callback to
            // be removed.
            if (this.provider.off && this.provider.on) {
                if (event === 'add') {
                    this.provider.off(
                        this.domainObject,
                        'add',
                        this.onProviderAdd,
                        this
                    );
                } else if (event === 'remove') {
                    this.provider.off(
                        this.domainObject,
                        'remove',
                        this.onProviderRemove,
                        this
                    );
                } else if (event === 'reorder') {
                    this.provider.off(
                        this.domainObject,
                        'reorder',
                        this.onProviderReorder,
                        this
                    );
                }
            }
        }
    };

    /**
     * Add a domain object to this composition.
     *
     * A call to [load]{@link module:openmct.CompositionCollection#load}
     * must have resolved before using this method.
     *
     * @param {module:openmct.DomainObject} child the domain object to add
     * @param {boolean} skipMutate true if the underlying provider should
     *        not be updated
     * @memberof module:openmct.CompositionCollection#
     * @name add
     */
    CompositionCollection.prototype.add = function (child, skipMutate) {
        if (!skipMutate) {
            if (!this.publicAPI.composition.checkPolicy(this.domainObject, child)) {
                throw `Object of type ${child.type} cannot be added to object of type ${this.domainObject.type}`;
            }

            this.provider.add(this.domainObject, child.identifier);
        } else {
            if (this.returnMutables && this.publicAPI.objects.supportsMutation(child.identifier)) {
                let keyString = this.publicAPI.objects.makeKeyString(child.identifier);

                child = this.publicAPI.objects._toMutable(child);
                this.mutables[keyString] = child;
            }

            this.emit('add', child);
        }
    };

    /**
     * Load the domain objects in this composition.
     *
     * @returns {Promise.<Array.<module:openmct.DomainObject>>} a promise for
     *          the domain objects in this composition
     * @memberof {module:openmct.CompositionCollection#}
     * @name load
     */
    CompositionCollection.prototype.load = function () {
        this.cleanUpMutables();

        return this.provider.load(this.domainObject)
            .then(function (children) {
                return Promise.all(children.map((c) => this.publicAPI.objects.get(c)));
            }.bind(this))
            .then(function (childObjects) {
                childObjects.forEach(c => this.add(c, true));

                return childObjects;
            }.bind(this))
            .then(function (children) {
                this.emit('load');

                return children;
            }.bind(this));
    };

    /**
     * Remove a domain object from this composition.
     *
     * A call to [load]{@link module:openmct.CompositionCollection#load}
     * must have resolved before using this method.
     *
     * @param {module:openmct.DomainObject} child the domain object to remove
     * @param {boolean} skipMutate true if the underlying provider should
     *        not be updated
     * @memberof module:openmct.CompositionCollection#
     * @name remove
     */
    CompositionCollection.prototype.remove = function (child, skipMutate) {
        if (!skipMutate) {
            this.provider.remove(this.domainObject, child.identifier);
        } else {
            if (this.returnMutables) {
                let keyString = this.publicAPI.objects.makeKeyString(child);
                if (this.mutables[keyString] !== undefined && this.mutables[keyString].isMutable) {
                    this.publicAPI.objects.destroyMutable(this.mutables[keyString]);
                    delete this.mutables[keyString];
                }
            }

            this.emit('remove', child);
        }
    };

    /**
     * Reorder the domain objects in this composition.
     *
     * A call to [load]{@link module:openmct.CompositionCollection#load}
     * must have resolved before using this method.
     *
     * @param {number} oldIndex
     * @param {number} newIndex
     * @memberof module:openmct.CompositionCollection#
     * @name remove
     */
    CompositionCollection.prototype.reorder = function (oldIndex, newIndex, skipMutate) {
        this.provider.reorder(this.domainObject, oldIndex, newIndex);
    };

    /**
     * Handle reorder from provider.
     * @private
     */
    CompositionCollection.prototype.onProviderReorder = function (reorderMap) {
        this.emit('reorder', reorderMap);
    };

    /**
     * Handle adds from provider.
     * @private
     */
    CompositionCollection.prototype.onProviderAdd = function (childId) {
        return this.publicAPI.objects.get(childId).then(function (child) {
            this.add(child, true);

            return child;
        }.bind(this));
    };

    /**
     * Handle removal from provider.
     * @private
     */
    CompositionCollection.prototype.onProviderRemove = function (child) {
        this.remove(child, true);
    };

    CompositionCollection.prototype._destroy = function () {
        if (this.mutationListener) {
            this.mutationListener();
            delete this.mutationListener;
        }
    };

    /**
     * Emit events.
     * @private
     */
    CompositionCollection.prototype.emit = function (event, ...payload) {
        this.listeners[event].forEach(function (l) {
            if (l.context) {
                l.callback.apply(l.context, payload);
            } else {
                l.callback(...payload);
            }
        });
    };

    CompositionCollection.prototype.cleanUpMutables = function () {
        Object.values(this.mutables).forEach(mutable => {
            this.publicAPI.objects.destroyMutable(mutable);
        });
    };

    return CompositionCollection;
});
