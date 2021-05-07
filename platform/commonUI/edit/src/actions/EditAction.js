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
 * Module defining EditAction. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {

        // A no-op action to return in the event that the action cannot
        // be completed.
        var NULL_ACTION = {
            perform: function () {
                return undefined;
            }
        };

        /**
         * The Edit action is performed when the user wishes to enter Edit
         * mode (typically triggered by the Edit button.) This will
         * show the user interface for editing (by way of a change in
         * route)
         * @memberof platform/commonUI/edit
         * @constructor
         * @implements {Action}
         */
        function EditAction($location, navigationService, $log, context) {
            var domainObject = (context || {}).domainObject;

            // We cannot enter Edit mode if we have no domain object to
            // edit, so verify that one was defined as part of the
            // context. (This is also verified in appliesTo, so this
            // would indicate abnormal behavior.)
            if (!domainObject) {
                $log.warn([
                    "No domain object to edit; ",
                    "edit action is not valid."
                ].join(""));

                return NULL_ACTION;
            }

            this.domainObject = domainObject;
            this.$location = $location;
            this.navigationService = navigationService;
        }

        /**
         * Enter edit mode.
         */
        EditAction.prototype.perform = function () {

            //If this is not the currently navigated object, then navigate
            // to it.
            if (this.navigationService.getNavigation() !== this.domainObject) {
                this.navigationService.setNavigation(this.domainObject);
            }

            this.domainObject.useCapability("editor");
        };

        /**
         * Check for applicability; verify that a domain object is present
         * for this action to be performed upon.
         * @param {ActionContext} context the context in which this action
         *        will be performed; should contain a `domainObject` property
         */
        EditAction.appliesTo = function (context) {
            var domainObject = (context || {}).domainObject,
                type = domainObject && domainObject.getCapability('type');

            // Only allow editing of types that support it and are not already
            // being edited
            return type && type.hasFeature('creation')
                && domainObject.hasCapability('editor')
                && !domainObject.getCapability('editor').isEditContextRoot();
        };

        return EditAction;
    }
);
