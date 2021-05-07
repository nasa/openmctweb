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
    function () {

        /**
         * Actions are reusable processes/behaviors performed by users within
         * the system, typically upon domain objects. Actions are commonly
         * exposed to users as menu items or buttons.
         *
         * Actions are usually registered via the `actions` extension
         * category, or (in advanced cases) via an `actionService`
         * implementation.
         *
         * @interface Action
         */

        /**
         * Perform the behavior associated with this action. The return type
         * may vary depending on which action has been performed; in general,
         * no return value should be expected.
         *
         * @method Action#perform
         */

        /**
         * Get metadata associated with this action.
         *
         * @method Action#getMetadata
         * @returns {ActionMetadata}
         */

        /**
         * Metadata associated with an Action. Actions of specific types may
         * extend this with additional properties.
         *
         * @typedef {Object} ActionMetadata
         * @property {string} key machine-readable identifier for this action
         * @property {string} name human-readable name for this action
         * @property {string} description human-readable description
         * @property {string} cssClass CSS class for icon
         * @property {ActionContext} context the context in which the action
         *           will be performed.
         */

        /**
         * Provides actions that can be performed within specific contexts.
         *
         * @interface ActionService
         */

        /**
         * Get actions which can be performed within a certain context.
         *
         * @method ActionService#getActions
         * @param {ActionContext} context the context in which the action will
         *        be performed
         * @return {Action[]} relevant actions
         */

        /**
         * A description of the context in which an action may occur.
         *
         * @typedef ActionContext
         * @property {DomainObject} [domainObject] the domain object being
         *           acted upon.
         * @property {DomainObject} [selectedObject] the selection at the
         *           time of action (e.g. the dragged object in a
         *           drag-and-drop operation.)
         * @property {string} [key] the machine-readable identifier of
         *           the relevant action
         * @property {string} [category] a string identifying the category
         *           of action being performed
         */

        /**
         * The ActionAggregator makes several actionService
         * instances act as those they were one. When requesting
         * actions for a given context, results from all
         * services will be assembled and concatenated.
         *
         * @memberof platform/core
         * @constructor
         * @implements {ActionService}
         * @param {ActionService[]} actionProviders an array
         *        of action services
         */
        function ActionAggregator(actionProviders) {
            this.actionProviders = actionProviders;
        }

        ActionAggregator.prototype.getActions = function (context) {
            // Get all actions from all providers, reduce down
            // to one array by concatenation
            return this.actionProviders.map(function (provider) {
                return provider.getActions(context);
            }).reduce(function (a, b) {
                return a.concat(b);
            }, []);
        };

        return ActionAggregator;
    }
);
