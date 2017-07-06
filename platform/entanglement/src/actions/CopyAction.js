/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    ['./AbstractComposeAction', './CopyActionWizard', './CancelError',],
    function (AbstractComposeAction, CopyActionWizard, CancelError) {

        /**
         * The CopyAction is available from context menus and allows a user to
         * deep copy an object to another location of their choosing.
         *
         * @implements {Action}
         * @constructor
         * @memberof platform/entanglement
         */
        function CopyAction(
            $log,
            policyService,
            copyService,
            dialogService,
            notificationService,
            context
        ) {
            this.dialog = undefined;
            this.notification = undefined;
            this.policyService = policyService;
            this.copyService = copyService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.context = context;
            this.$log = $log;

            if (context.selectedObject) {
                this.newParent = context.domainObject;
                this.object = context.selectedObject;
            } else {
                this.object = context.domainObject;
            }
        }

        /**
         * Updates user about progress of copy. Should not be invoked by
         * client code under any circumstances.
         *
         * @private
         * @param phase
         * @param totalObjects
         * @param processed
         */
        CopyAction.prototype.progress = function (phase, totalObjects, processed) {
            /*
             Copy has two distinct phases. In the first phase a copy plan is
             made in memory. During this phase of execution, the user is
             shown a blocking 'modal' dialog.

             In the second phase, the copying is taking place, and the user
             is shown non-invasive banner notifications at the bottom of the screen.
             */
            if (phase.toLowerCase() === 'preparing' && !this.dialog) {
                this.dialog = this.dialogService.showBlockingMessage({
                    title: "Preparing to copy objects",
                    hint: "Do not navigate away from this page or close this browser tab while this message is displayed.",
                    unknownProgress: true,
                    severity: "info"
                });
            } else if (phase.toLowerCase() === "copying") {
                if (this.dialog) {
                    this.dialog.dismiss();
                }
                if (!this.notification) {
                    this.notification = this.notificationService
                        .notify({
                            title: "Copying objects",
                            unknownProgress: false,
                            severity: "info"
                        });
                }
                this.notification.model.progress = (processed / totalObjects) * 100;
                this.notification.model.title = ["Copied ", processed, "of ",
                    totalObjects, "objects"].join(" ");
            }
        };

        CopyAction.prototype.cloneContext = function () {
            var clone = {}, original = this.context;
            Object.keys(original).forEach(function (k) {
                clone[k] = original[k];
            });
            return clone;
        };

        CopyAction.prototype.createWizard = function () {
            var self = this,
                title = "Duplicate " + this.object.getModel().name + " To a Location",
                label = "Duplicate To",
                object = this.object,
                copyService = this.copyService,
                policyService = this.policyService;

            var validateLocation = function (newParentObj) {
                var newContext = self.cloneContext();
                newContext.selectedObject = object;
                newContext.domainObject = newParentObj;
                return copyService.validate(object, newParentObj) &&
                    policyService.allow("action", self, newContext);
            };

            return new CopyActionWizard(
                this.object,
                undefined,
                validateLocation,
                title,
                label);
        };

        CopyAction.prototype.performBase = function () {
            var copyService = this.copyService,
                dialogService = this.dialogService,
                newParent = this.newParent,
                object = this.object;

            if (newParent) {
                return copyService.perform(object, newParent);
            }

            var wizard = this.createWizard();
            return dialogService.getUserInput(
                wizard.getFormStructure(),
                wizard.getInitialFormValue()
            ).then(function (userInput) {
                return copyService.perform(object, userInput.location);
            }, function () {
                return Promise.reject(new CancelError(CANCEL_MESSAGE));
            }.bind(this));
        };

        /**
         * Executes the CopyAction. The CopyAction uses the default behaviour of
         * the AbstractComposeAction, but extends it to support notification
         * updates of progress on copy.
         */
        CopyAction.prototype.perform = function () {
            var self = this;

            function success() {
                self.notification.dismiss();
                self.notificationService.info("Copying complete.");
            }

            function error(errorDetails) {
                // No need to notify user of their own cancellation
                if (errorDetails instanceof CancelError) {
                    return;
                }

                var errorDialog,
                    errorMessage = {
                        title: "Error copying objects.",
                        severity: "error",
                        hint: errorDetails.message,
                        minimized: true, // want the notification to be minimized initially (don't show banner)
                        options: [{
                            label: "OK",
                            callback: function () {
                                errorDialog.dismiss();
                            }
                        }]
                    };

                self.dialog.dismiss();
                if (self.notification) {
                    self.notification.dismiss(); // Clear the progress notification
                }
                self.$log.error("Error copying objects. ", errorDetails);
                //Show a minimized notification of error for posterity
                self.notificationService.notify(errorMessage);
                //Display a blocking message
                errorDialog = self.dialogService.showBlockingMessage(errorMessage);

            }

            function notification(details) {
                self.progress(details.phase, details.totalObjects, details.processed);
            }

            return self.performBase()
                .then(success, error, notification);
        };

        CopyAction.appliesTo = AbstractComposeAction.appliesTo;

        return CopyAction;
    }
);

