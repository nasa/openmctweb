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

define(['EventEmitter'], function (EventEmitter) {
    const DEFAULT_VIEW_PRIORITY = 100;

    /**
     * A ViewRegistry maintains the definitions for different kinds of views
     * that may occur in different places in the user interface.
     * @interface ViewRegistry
     * @memberof module:openmct
     */
    function ViewRegistry() {
        EventEmitter.apply(this);
        this.providers = {};
    }

    ViewRegistry.prototype = Object.create(EventEmitter.prototype);

    /**
     * @private for platform-internal use
     * @param {*} item the object to be viewed
     * @param {array} objectPath - The current contextual object path of the view object
     *                             eg current domainObject is located under MyItems which is under Root
     * @returns {module:openmct.ViewProvider[]} any providers
     *          which can provide views of this object
     */
    ViewRegistry.prototype.get = function (item, objectPath) {
        if (objectPath === undefined) {
            throw "objectPath must be provided to get applicable views for an object";
        }

        function byPriority(providerA, providerB) {
            let priorityA = providerA.priority ? providerA.priority(item) : DEFAULT_VIEW_PRIORITY;
            let priorityB = providerB.priority ? providerB.priority(item) : DEFAULT_VIEW_PRIORITY;

            return priorityB - priorityA;
        }

        return this.getAllProviders()
            .filter(function (provider) {
                return provider.canView(item, objectPath);
            }).sort(byPriority);
    };

    /**
     * @private
     */
    ViewRegistry.prototype.getAllProviders = function () {
        return Object.values(this.providers);
    };

    /**
     * Register a new type of view.
     *
     * @param {module:openmct.ViewProvider} provider the provider for this view
     * @method addProvider
     * @memberof module:openmct.ViewRegistry#
     */
    ViewRegistry.prototype.addProvider = function (provider) {
        const key = provider.key;
        if (key === undefined) {
            throw "View providers must have a unique 'key' property defined";
        }

        if (this.providers[key] !== undefined) {
            console.warn("Provider already defined for key '%s'. Provider keys must be unique.", key);
        }

        this.providers[key] = provider;
    };

    /**
     * @private
     */
    ViewRegistry.prototype.getByProviderKey = function (key) {
        return this.providers[key];
    };

    /**
     * Used internally to support seamless usage of new views with old
     * views.
     * @private
     */
    ViewRegistry.prototype.getByVPID = function (vpid) {
        return this.providers.filter(function (p) {
            return p.vpid === vpid;
        })[0];
    };

    /**
     * A View is used to provide displayable content, and to react to
     * associated life cycle events.
     *
     * @name View
     * @interface
     * @memberof module:openmct
     */

    /**
     * Populate the supplied DOM element with the contents of this view.
     *
     * View implementations should use this method to attach any
     * listeners or acquire other resources that are necessary to keep
     * the contents of this view up-to-date.
     *
     * @param {HTMLElement} container the DOM element to populate
     * @method show
     * @memberof module:openmct.View#
     */

    /**
     * Indicates whether or not the application is in edit mode. This supports
     * views that have distinct visual and behavioral elements when the
     * navigated object is being edited.
     *
     * For cases where a completely separate view is desired for editing purposes,
     * see {@link openmct.ViewProvider#edit}
     *
     * @param {boolean} isEditing
     * @method show
     * @memberof module:openmct.View#
     */

    /**
     * Release any resources associated with this view.
     *
     * View implementations should use this method to detach any
     * listeners or release other resources that are no longer necessary
     * once a view is no longer used.
     *
     * @method destroy
     * @memberof module:openmct.View#
     */

    /**
     * Returns the selection context.
     *
     * View implementations should use this method to customize
     * the selection context.
     *
     * @method getSelectionContext
     * @memberof module:openmct.View#
     */

    /**
     * Exposes types of views in Open MCT.
     *
     * @interface ViewProvider
     * @property {string} key a unique identifier for this view
     * @property {string} name the human-readable name of this view
     * @property {string} [description] a longer-form description (typically
     *           a single sentence or short paragraph) of this kind of view
     * @property {string} [cssClass] the CSS class to apply to labels for this
     *           view (to add icons, for instance)
     * @memberof module:openmct
     */

    /**
     * Check if this provider can supply views for a domain object.
     *
     * When called by Open MCT, this may include additional arguments
     * which are on the path to the object to be viewed; for instance,
     * when viewing "A Folder" within "My Items", this method will be
     * invoked with "A Folder" (as a domain object) as the first argument
     *
     * @method canView
     * @memberof module:openmct.ViewProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to be viewed
     * @param {array} objectPath - The current contextual object path of the view object
     *                             eg current domainObject is located under MyItems which is under Root
     * @returns {boolean} 'true' if the view applies to the provided object,
     *          otherwise 'false'.
     */

    /**
     * An optional function that defines whether or not this view can be used to edit a given object.
     * If not provided, will default to `false` and the view will not support editing. To support editing,
     * return true from this function and then -
     * * Return a {@link openmct.View} from the `view` function, using the `onEditModeChange` callback to
     * add and remove editing elements from the view
     * OR
     * * Return a {@link openmct.View} from the `view` function defining a read-only view.
     * AND
     * * Define an {@link openmct.ViewProvider#Edit} function on the view provider that returns an
     * editing-specific view.
     *
     * @method canEdit
     * @memberof module:openmct.ViewProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to be edited
     * @param {array} objectPath - The current contextual object path of the view object
     *                             eg current domainObject is located under MyItems which is under Root
     * @returns {boolean} 'true' if the view can be used to edit the provided object,
     *          otherwise 'false'.
     */

    /**
     * Optional method determining the priority of a given view. If this
     * function is not defined on a view provider, then a default priority
     * of 100 will be applicable for all objects supported by this view.
     *
     * @method priority
     * @memberof module:openmct.ViewProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to be viewed
     * @returns {number} The priority of the view. If multiple views could apply
     *          to an object, the view that returns the lowest number will be
     *          the default view.
     */

    /**
     * Provide a view of this object.
     *
     * When called by Open MCT, the following arguments will be passed to it:
     * @param {object} domainObject - the domainObject that the view is provided for
     * @param {array} objectPath - The current contextual object path of the view object
     *                             eg current domainObject is located under MyItems which is under Root
     *
     * @method view
     * @memberof module:openmct.ViewProvider#
     * @param {*} object the object to be viewed
     * @returns {module:openmct.View} a view of this domain object
     */

    /**
     * Provide an edit-mode specific view of this object.
     *
     * If optionally specified, this function will be called when the application
     * enters edit mode. This will cause the active non-edit mode view and its
     * dom element to be destroyed.
     *
     * @method edit
     * @memberof module:openmct.ViewProvider#
     * @param {*} object the object to be edit
     * @returns {module:openmct.View} an editable view of this domain object
     */

    return ViewRegistry;

});
