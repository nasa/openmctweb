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

define([], function () {

    /**
     * A ToolbarRegistry maintains the definitions for toolbars.
     *
     * @interface ToolbarRegistry
     * @memberof module:openmct
     */
    function ToolbarRegistry() {
        this.providers = {};
    }

    /**
     * Gets toolbar controls from providers which can provide a toolbar for this selection.
     *
     * @param {object} selection the selection object
     * @returns {Object[]} an array of objects defining controls for the toolbar
     * @private for platform-internal use
     */
    ToolbarRegistry.prototype.get = function (selection) {
        const providers = this.getAllProviders().filter(function (provider) {
            return provider.forSelection(selection);
        });

        const structure = [];

        providers.forEach(provider => {
            provider.toolbar(selection).forEach(item => structure.push(item));
        });

        return structure;
    };

    /**
     * @private
     */
    ToolbarRegistry.prototype.getAllProviders = function () {
        return Object.values(this.providers);
    };

    /**
     * @private
     */
    ToolbarRegistry.prototype.getByProviderKey = function (key) {
        return this.providers[key];
    };

    /**
     * Registers a new type of toolbar.
     *
     * @param {module:openmct.ToolbarRegistry} provider the provider for this toolbar
     * @method addProvider
     * @memberof module:openmct.ToolbarRegistry#
     */
    ToolbarRegistry.prototype.addProvider = function (provider) {
        const key = provider.key;

        if (key === undefined) {
            throw "Toolbar providers must have a unique 'key' property defined.";
        }

        if (this.providers[key] !== undefined) {
            console.warn("Provider already defined for key '%s'. Provider keys must be unique.", key);
        }

        this.providers[key] = provider;
    };

    /**
     * Exposes types of toolbars in Open MCT.
     *
     * @interface ToolbarProvider
     * @property {string} key a unique identifier for this toolbar
     * @property {string} name the human-readable name of this toolbar
     * @property {string} [description] a longer-form description (typically
     *           a single sentence or short paragraph) of this kind of toolbar
     * @memberof module:openmct
     */

    /**
     * Checks if this provider can supply toolbar for a selection.
     *
     * @method forSelection
     * @memberof module:openmct.ToolbarProvider#
     * @param {module:openmct.selection} selection
     * @returns {boolean} 'true' if the toolbar applies to the provided selection,
     *          otherwise 'false'.
     */

    /**
     * Provides controls that comprise a toolbar.
     *
     * @method toolbar
     * @memberof module:openmct.ToolbarProvider#
     * @param {object} selection the selection object
     * @returns {Object[]} an array of objects defining controls for the toolbar.
     */

    return ToolbarRegistry;
});
