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

/**
 * Module defining ActionProvider. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {

        /**
         * An ActionProvider (implementing ActionService) provides actions
         * that are applicable in specific contexts, chosen from a set
         * of actions exposed via extension (specifically, the "actions"
         * category of extension.)
         *
         * @memberof platform/core
         * @imeplements {ActionService}
         * @constructor
         */
        function ActionProvider(actions, $log) {
            var self = this;

            this.$log = $log;

            // Build up look-up tables
            this.actions = actions;
            this.actionsByKey = {};
            this.actionsByCategory = {};
            actions.forEach(function (Action) {
                // Get an action's category or categories
                var categories = Action.category || [];

                // Convert to an array if necessary
                categories = Array.isArray(categories)
                    ? categories : [categories];

                // Store action under all relevant categories
                categories.forEach(function (category) {
                    self.actionsByCategory[category] =
                        self.actionsByCategory[category] || [];
                    self.actionsByCategory[category].push(Action);
                });

                // Store action by ekey as well
                if (Action.key) {
                    self.actionsByKey[Action.key] =
                        self.actionsByKey[Action.key] || [];
                    self.actionsByKey[Action.key].push(Action);
                }
            });
        }

        ActionProvider.prototype.getActions = function (actionContext) {
            var context = (actionContext || {}),
                category = context.category,
                key = context.key,
                $log = this.$log,
                candidates;

            // Instantiate an action; invokes the constructor and
            // additionally fills in the action's getMetadata method
            // with the extension definition (if no getMetadata
            // method was supplied.)
            function instantiateAction(Action, ctxt) {
                var action = new Action(ctxt),
                    metadata;

                // Provide a getMetadata method that echos
                // declarative bindings, as well as context,
                // unless the action has defined its own.
                if (!action.getMetadata) {
                    metadata = Object.create(Action.definition || {});
                    metadata.context = ctxt;
                    action.getMetadata = function () {
                        return metadata;
                    };
                }

                return action;
            }

            // Filter the array of actions down to those which are
            // applicable in a given context, according to the static
            // appliesTo method of given actions (if defined), and
            // instantiate those applicable actions.
            function createIfApplicable(actions, ctxt) {
                function isApplicable(Action) {
                    return Action.appliesTo ? Action.appliesTo(ctxt) : true;
                }

                function instantiate(Action) {
                    try {
                        return instantiateAction(Action, ctxt);
                    } catch (e) {
                        $log.error([
                            "Could not instantiate action",
                            Action.key,
                            "due to:",
                            e.message
                        ].join(" "));

                        return undefined;
                    }
                }

                function isDefined(action) {
                    return action !== undefined;
                }

                return (actions || []).filter(isApplicable)
                    .map(instantiate)
                    .filter(isDefined);
            }

            // Match actions to the provided context by comparing "key"
            // and/or "category" parameters, if specified.
            candidates = this.actions;
            if (key) {
                candidates = this.actionsByKey[key];
                if (category) {
                    candidates = candidates.filter(function (Action) {
                        return Action.category === category;
                    });
                }
            } else if (category) {
                candidates = this.actionsByCategory[category];
            }

            // Instantiate those remaining actions, with additional
            // filtering per any appliesTo methods defined on those
            // actions.
            return createIfApplicable(candidates, context);
        };

        return ActionProvider;
    }
);
