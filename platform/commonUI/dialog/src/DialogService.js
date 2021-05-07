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
 * This bundle implements the dialog service, which can be used to
 * launch dialogs for user input & notifications.
 * @namespace platform/commonUI/dialog
 */
define(
    [],
    function () {
        /**
         * The dialog service is responsible for handling window-modal
         * communication with the user, such as displaying forms for user
         * input.
         * @memberof platform/commonUI/dialog
         * @constructor
         */
        function DialogService(overlayService, $q, $log, $document) {
            this.overlayService = overlayService;
            this.$q = $q;
            this.$log = $log;
            this.activeOverlay = undefined;

            this.findBody = function () {
                return $document.find('body');
            };
        }

        /**
         * @private
         */
        DialogService.prototype.dismissOverlay = function (overlay) {
            //Dismiss the overlay
            overlay.dismiss();

            //If dialog is the current active one, dismiss it
            if (overlay === this.activeOverlay) {
                this.activeOverlay = undefined;
            }
        };

        DialogService.prototype.getDialogResponse = function (key, model, resultGetter, typeClass) {
            // We will return this result as a promise, because user
            // input is asynchronous.
            var deferred = this.$q.defer(),
                self = this,
                overlay,
                handleEscKeydown;

            // Confirm function; this will be passed in to the
            // overlay-dialog template and associated with a
            // OK button click
            function confirm(value) {
                // Pass along the result
                deferred.resolve(resultGetter ? resultGetter() : value);
                self.dismissOverlay(overlay);
            }

            // Cancel function; this will be passed in to the
            // overlay-dialog template and associated with a
            // Cancel or X button click
            function cancel() {
                deferred.reject();
                self.findBody().off('keydown', handleEscKeydown);
                self.dismissOverlay(overlay);
            }

            handleEscKeydown = function (event) {
                if (event.keyCode === 27) {
                    cancel();
                }
            };

            // Add confirm/cancel callbacks
            model.confirm = confirm;
            model.cancel = cancel;

            this.findBody().on('keydown', handleEscKeydown);

            if (this.canShowDialog(model)) {
                // Add the overlay using the OverlayService, which
                // will handle actual insertion into the DOM
                overlay = this.activeOverlay = this.overlayService.createOverlay(
                    key,
                    model,
                    typeClass || "t-dialog"
                );
            } else {
                deferred.reject();
            }

            return deferred.promise;
        };

        /**
         * Request user input via a window-modal dialog.
         *
         * @param {FormModel} formModel a description of the form
         *        to be shown (see platform/forms)
         * @param {object} value the initial state of the form
         * @returns {Promise} a promise for the form value that the
         *          user has supplied; this may be rejected if
         *          user input cannot be obtained (for instance,
         *          because the user cancelled the dialog)
         */
        DialogService.prototype.getUserInput = function (formModel, value) {
            var overlayModel = {
                title: formModel.name,
                message: formModel.message,
                structure: formModel,
                value: value
            };

            // Provide result from the model
            function resultGetter() {
                return overlayModel.value;
            }

            // Show the overlay-dialog
            return this.getDialogResponse(
                "overlay-dialog",
                overlayModel,
                resultGetter
            );
        };

        /**
         * Request that the user chooses from a set of options,
         * which will be shown as buttons.
         *
         * @param dialogModel a description of the dialog to show
         * @return {Promise} a promise for the user's choice
         */
        DialogService.prototype.getUserChoice = function (dialogModel) {
            // Show the overlay-options dialog
            return this.getDialogResponse(
                "overlay-options",
                { dialog: dialogModel }
            );
        };

        /**
         * Tests if a dialog can be displayed. A modal dialog may only be
         * displayed if one is not already visible.
         * Will log a warning message if it can't display a dialog.
         * @returns {boolean} true if dialog is currently visible, false
         * otherwise
         */
        DialogService.prototype.canShowDialog = function (dialogModel) {
            if (this.activeOverlay) {
                // Only one dialog should be shown at a time.
                // The application design should be such that
                // we never even try to do this.
                this.$log.warn([
                    "Dialog already showing; ",
                    "unable to show ",
                    dialogModel.title
                ].join(""));

                return false;
            } else {
                return true;
            }
        };

        /**
         * A user action that can be performed from a blocking dialog. These
         * actions will be rendered as buttons within a blocking dialog.
         *
         * @typedef DialogOption
         * @property {string} label a label to be displayed as the button
         * text for this action
         * @property {function} callback a function to be called when the
         * button is clicked
         */

        /**
         * @typedef DialogHandle
         * @property {function} dismiss a function to dismiss the given dialog
         */

        /**
         * A description of the model options that may be passed to the
         * showBlockingMessage method. Note that the DialogModel described
         * here is shared with the Notifications framework.
         * @see NotificationService
         *
         * @typedef DialogModel
         * @property {string} title the title to use for the dialog
         * @property {string} severity the severity level of this message.
         * These are defined in a bundle constant with key 'dialogSeverity'
         * @property {string} hint the 'hint' message to show below the title
         * @property {string} actionText text that indicates a current action,
         * shown above a progress bar to indicate what's happening.
         * @property {number} progress a percentage value (1-100)
         * indicating the completion of the blocking task
         * @property {boolean} delay adds a brief delay before loading
         * the dialog. Useful for removing the dialog flicker when the
         * conditions for displaying the dialog change rapidly.
         * @property {string} progressText the message to show below a
         * progress bar to indicate progress. For example, this might be
         * used to indicate time remaining, or items still to process.
         * @property {boolean} unknownProgress some tasks may be
         * impossible to provide an estimate for. Providing a true value for
         * this attribute will indicate to the user that the progress and
         * duration cannot be estimated.
         * @property {DialogOption} primaryOption an action that will
         * be added to the dialog as a button. The primary action can be
         * used as the suggested course of action for the user. Making it
         * distinct from other actions allows it to be styled differently,
         * and treated preferentially in banner mode.
         * @property {DialogOption[]} options a list of actions that will
         * be added to the dialog as buttons.
         */

        /**
         * Displays a blocking (modal) dialog. This dialog can be used for
         * displaying messages that require the user's
         * immediate attention. The message may include an indication of
         * progress, as well as a series of actions that
         * the user can take if necessary
         * @param {DialogModel} dialogModel defines options for the dialog
         * @param {typeClass} string tells overlayService that this overlay should use appropriate CSS class
         * @returns {boolean | {DialogHandle}}
         */
        DialogService.prototype.showBlockingMessage = function (dialogModel) {
            if (this.canShowDialog(dialogModel)) {
                // Add the overlay using the OverlayService, which
                // will handle actual insertion into the DOM
                var self = this,
                    overlay = this.overlayService.createOverlay(
                        "overlay-blocking-message",
                        dialogModel,
                        "t-dialog-sm"
                    );

                this.activeOverlay = overlay;

                return {
                    dismiss: function () {
                        self.dismissOverlay(overlay);
                    }
                };
            } else {
                return false;
            }
        };

        return DialogService;
    }
);
