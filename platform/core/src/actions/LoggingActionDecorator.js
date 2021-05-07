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
 * Module defining LoggingActionDecorator. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {

        /**
         * The LoggingActionDecorator decorates an ActionService such that
         * the actions it exposes always emit a log message when they are
         * performed.
         *
         * @memberof platform/core
         * @constructor
         * @implements {ActionService}
         * @param $log Angular's logging service
         * @param {ActionService} actionService the decorated action service
         */
        function LoggingActionDecorator($log, actionService) {
            this.$log = $log;
            this.actionService = actionService;
        }

        LoggingActionDecorator.prototype.getActions = function () {
            var actionService = this.actionService,
                $log = this.$log;

            // Decorate the perform method of the specified action, such that
            // it emits a log message whenever performed.
            function addLogging(action) {
                var logAction = Object.create(action),
                    metadata = action.getMetadata() || {},
                    context = metadata.context || {},
                    domainObject = context.domainObject;

                logAction.perform = function () {
                    $log.info([
                        "Performing action ",
                        metadata.key,
                        " upon ",
                        domainObject && domainObject.getId()
                    ].join(""));

                    return action.perform.apply(action, arguments);
                };

                return logAction;
            }

            return actionService.getActions.apply(
                actionService,
                arguments
            ).map(addLogging);
        };

        return LoggingActionDecorator;
    }
);
