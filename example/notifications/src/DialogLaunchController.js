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
    [],
    function () {
        "use strict";

        /**
         * A controller for the dialog launch view. This view allows manual
         * launching of dialogs for demonstration and testing purposes. It
         * also demonstrates the use of the DialogService.
         * @param $scope
         * @param $timeout
         * @param $log
         * @param dialogService
         * @param notificationService
         * @constructor
         */
        function DialogLaunchController($scope, $timeout, $log, dialogService, notificationService) {

            /*
            Demonstrates launching a progress dialog and updating it
             periodically with the progress of an ongoing process.
             */
            $scope.launchProgress = function (knownProgress) {
                var dialog,
                    model = {
                        title: "Progress Dialog Example",
                        progress: 0,
                        hint: "Do not navigate away from this page or close this browser tab while this operation is in progress.",
                        actionText: "Calculating...",
                        unknownProgress: !knownProgress,
                        unknownDuration: false,
                        severity: "info",
                        options: [
                            {
                                label: "Cancel Operation",
                                callback: function () {
                                    $log.debug("Operation cancelled");
                                    dialog.dismiss();
                                }
                            },
                            {
                                label: "Do something else...",
                                callback: function () {
                                    $log.debug("Something else pressed");
                                }
                            }
                        ]
                    };

                function incrementProgress() {
                    model.progress = Math.min(100, Math.floor(model.progress + Math.random() * 30));
                    model.progressText = ["Estimated time remaining: about ", 60 - Math.floor((model.progress / 100) * 60), " seconds"].join(" ");
                    if (model.progress < 100) {
                        $timeout(incrementProgress, 1000);
                    }
                }

                dialog = dialogService.showBlockingMessage(model);

                if (dialog) {
                    //Do processing here
                    model.actionText = "Processing 100 objects...";
                    if (knownProgress) {
                        $timeout(incrementProgress, 1000);
                    }
                } else {
                    $log.error("Could not display modal dialog");
                }
            };

            /*
             Demonstrates launching an error dialog
             */
            $scope.launchError = function () {
                var dialog,
                    model = {
                        title: "Error Dialog Example",
                        actionText: "Something happened, and it was not good.",
                        severity: "error",
                        options: [
                            {
                                label: "Try Again",
                                callback: function () {
                                    $log.debug("Try Again Pressed");
                                    dialog.dismiss();
                                }
                            },
                            {
                                label: "Cancel",
                                callback: function () {
                                    $log.debug("Cancel Pressed");
                                    dialog.dismiss();
                                }
                            }
                        ]
                    };
                dialog = dialogService.showBlockingMessage(model);

                if (!dialog) {
                    $log.error("Could not display modal dialog");
                }
            };

            /*
             Demonstrates launching an error dialog
             */
            $scope.launchInfo = function () {
                var dialog,
                    model = {
                        title: "Info Dialog Example",
                        actionText: "This is an example of a blocking info"
                        + " dialog. This dialog can be used to draw the user's"
                        + " attention to an event.",
                        severity: "info",
                        primaryOption: {
                            label: "OK",
                            callback: function () {
                                $log.debug("OK Pressed");
                                dialog.dismiss();
                            }
                        }
                    };

                dialog = dialogService.showBlockingMessage(model);

                if (!dialog) {
                    $log.error("Could not display modal dialog");
                }
            };

        }

        return DialogLaunchController;
    }
);
