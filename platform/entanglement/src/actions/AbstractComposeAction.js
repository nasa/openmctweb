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
    ['./CancelError'],
    function (CancelError) {
        var CANCEL_MESSAGE = "User cancelled location selection.";

        /**
         * Common interface exposed by services which support move, copy,
         * and link actions.
         * @interface platform/entanglement.AbstractComposeService
         * @private
         */
        /**
         * Change the composition of the specified objects. Note that this
         * should only be invoked after successfully validating.
         *
         * @param {DomainObject} domainObject  the domain object to
         *    move, copy, or link.
         * @param {DomainObject} parent  the domain object whose composition
         *    will be changed to contain the domainObject (or its duplicate)
         * @returns {Promise} A promise that is fulfilled when the
         *    duplicate operation has completed.
         * @method platform/entanglement.AbstractComposeService#perform
         */
        /**
         * Check if this composition change is valid for these objects.
         *
         * @param {DomainObject} domainObject  the domain object to
         *    move, copy, or link.
         * @param {DomainObject} parent  the domain object whose composition
         *    will be changed to contain the domainObject (or its duplicate)
         * @returns {boolean} true if this composition change is allowed
         * @method platform/entanglement.AbstractComposeService#validate
         */

        /**
         * Template class for Move, Copy, and Link actions.
         *
         * @implements {Action}
         * @constructor
         * @private
         * @memberof platform/entanglement
         * @param {PolicyService} policyService the policy service to use to
         *        verify that variants of this action are allowed
         * @param {platform/entanglement.LocationService} locationService a
         *        service to request destinations from the user
         * @param {platform/entanglement.AbstractComposeService} composeService
         *        a service which will handle actual changes to composition
         * @param {ActionContext} the context in which the action will be performed
         * @param {string} verb the verb to display for the action (e.g. "Move")
         * @param {string} [suffix] a string to display in the dialog title;
         *        default is "to a new location"
         */
        function AbstractComposeAction(
            policyService,
            locationService,
            composeService,
            context,
            verb,
            suffix
        ) {
            if (context.selectedObject) {
                this.newParent = context.domainObject;
                this.object = context.selectedObject;
            } else {
                this.object = context.domainObject;
            }

            this.currentParent = this.object
                .getCapability('context')
                .getParent();

            this.context = context;
            this.policyService = policyService;
            this.locationService = locationService;
            this.composeService = composeService;
            this.verb = verb || "Compose";
            this.suffix = suffix || "To a New Location";
        }

        AbstractComposeAction.prototype.cloneContext = function () {
            var clone = {}, original = this.context;
            Object.keys(original).forEach(function (k) {
                clone[k] = original[k];
            });

            return clone;
        };

        AbstractComposeAction.prototype.perform = function () {
            var dialogTitle,
                label,
                validateLocation,
                self = this,
                locationService = this.locationService,
                composeService = this.composeService,
                currentParent = this.currentParent,
                newParent = this.newParent,
                object = this.object;

            if (newParent) {
                return composeService.perform(object, newParent);
            }

            dialogTitle = [this.verb, object.getModel().name, this.suffix]
                .join(" ");

            label = this.verb + " To";

            validateLocation = function (newParentObj) {
                var newContext = self.cloneContext();
                newContext.selectedObject = object;
                newContext.domainObject = newParentObj;

                return composeService.validate(object, newParentObj)
                    && self.policyService.allow("action", self, newContext);
            };

            return locationService.getLocationFromUser(
                dialogTitle,
                label,
                validateLocation,
                currentParent
            ).then(function (newParentObj) {
                return composeService.perform(object, newParentObj);
            }, function () {
                return Promise.reject(new CancelError(CANCEL_MESSAGE));
            }.bind(this));
        };

        AbstractComposeAction.appliesTo = function (context) {
            var applicableObject =
                context.selectedObject || context.domainObject;

            return Boolean(applicableObject
                && applicableObject.hasCapability('context'));
        };

        return AbstractComposeAction;
    }
);

