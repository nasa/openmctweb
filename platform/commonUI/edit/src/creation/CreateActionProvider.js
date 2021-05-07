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
 * Module defining CreateActionProvider.js. Created by vwoeltje on 11/10/14.
 */
define(
    ["./CreateAction"],
    function (CreateAction) {

        /**
         * The CreateActionProvider is an ActionProvider which introduces
         * a Create action for each creatable domain object type.
         *
         * @memberof platform/commonUI/browse
         * @constructor
         * @implements {ActionService}
         *
         * @param {TypeService} typeService the type service, used to discover
         *        available types
         * @param {DialogService} dialogService the dialog service, used by
         *        specific Create actions to get user input to populate the
         *        model of the newly-created domain object.
         * @param {CreationService} creationService the creation service (also
         *        introduced in this bundle), responsible for handling actual
         *        object creation.
         */
        function CreateActionProvider(typeService, policyService) {
            this.typeService = typeService;
            this.policyService = policyService;
        }

        CreateActionProvider.prototype.getActions = function (actionContext) {
            var context = actionContext || {},
                key = context.key,
                destination = context.domainObject,
                self = this;

            // We only provide Create actions, and we need a
            // domain object to serve as the container for the
            // newly-created object (although the user may later
            // make a different selection)
            if (key !== 'create' || !destination) {
                return [];
            }

            // Introduce one create action per type
            return this.typeService.listTypes().filter(function (type) {
                return self.policyService.allow("creation", type);
            }).map(function (type) {
                return new CreateAction(
                    type,
                    destination,
                    context
                );
            });
        };

        return CreateActionProvider;
    }
);
