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
 * Module defining MCTContainer. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {

        /**
         * The mct-container is similar to the mct-include directive
         * insofar as it allows templates to be referenced by
         * symbolic keys instead of by URL. Unlike mct-include, it
         * supports transclusion.
         *
         * Unlike mct-include, mct-container accepts a key as a
         * plain string attribute, instead of as an Angular
         * expression.
         *
         * @memberof platform/commonUI/general
         * @constructor
         */
        function MCTContainer(containers) {
            var containerMap = {};

            // Initialize container map from extensions
            containers.forEach(function (container) {
                containerMap[container.key] = container;
            });

            return {

                // Allow only at the element level
                restrict: 'E',

                // Support transclusion
                transclude: true,

                // Create a new (non-isolate) scope
                scope: true,

                // Populate initial scope based on attributes requested
                // by the container definition
                link: function (scope, element, attrs) {
                    var key = attrs.key,
                        container = containerMap[key],
                        alias = "container",
                        copiedAttributes = {};

                    if (container) {
                        alias = container.alias || alias;
                        (container.attributes || []).forEach(function (attr) {
                            copiedAttributes[attr] = attrs[attr];
                        });
                    }

                    scope[alias] = copiedAttributes;
                },

                template: function (element, attrs) {
                    var key = attrs.key,
                        container = containerMap[key];

                    return container ? container.template : "";
                }
            };
        }

        return MCTContainer;
    }
);
