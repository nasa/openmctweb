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
         * Allows launching of notification messages for the purposes of
         * demonstration and testing. Also demonstrates use of
         * the NotificationService. Notifications are non-blocking messages that
         * appear at the bottom of the screen to inform the user of events
         * in a non-intrusive way. For more information see the
         * {@link NotificationService}
         * @param $scope
         * @param $timeout
         * @param $log
         * @param notificationService
         * @constructor
         */
        function NotificationLaunchController($scope, $timeout, $log, notificationService) {
            var messageCounter = 1;

            function getExampleActionText() {
                var actionTexts = [
                    "Adipiscing turpis mauris in enim elementu hac, enim aliquam etiam.",
                    "Eros turpis, pulvinar turpis eros eu",
                    "Lundium nascetur a, lectus montes ac, parturient in natoque, duis risus risus pulvinar pid rhoncus, habitasse auctor natoque!"
                ];

                return actionTexts[Math.floor(Math.random() * 3)];
            }

            /**
             * Launch a new notification with a severity level of 'Error'.
             */
            $scope.newError = function () {
                notificationService.notify({
                    title: "Example error notification " + messageCounter++,
                    hint: "An error has occurred",
                    severity: "error"
                });
            };

            /**
             * Launch a new notification with a severity of 'Alert'.
             */
            $scope.newAlert = function () {
                notificationService.notify({
                    title: "Alert notification " + (messageCounter++),
                    hint: "This is an alert message",
                    severity: "alert",
                    autoDismiss: true
                });
            };

            /**
             * Launch a new notification with a progress bar that is updated
             * periodically, tracking an ongoing process.
             */
            $scope.newProgress = function () {
                let progress = 0;
                var notificationModel = {
                    title: "Progress notification example",
                    severity: "info",
                    progress: progress,
                    actionText: getExampleActionText()
                };
                let notification;

                /**
                 * Simulate an ongoing process and update the progress bar.
                 * @param notification
                 */
                function incrementProgress() {
                    progress = Math.min(100, Math.floor(progress + Math.random() * 30));
                    let progressText = ["Estimated time"
                    + " remaining:"
                    + " about ", 60 - Math.floor((progress / 100) * 60), " seconds"].join(" ");
                    notification.progress(progress, progressText);

                    if (progress < 100) {
                        $timeout(function () {
                            incrementProgress(notificationModel);
                        }, 1000);
                    }
                }

                notification = notificationService.notify(notificationModel);
                incrementProgress();
            };

            /**
             * Launch a new notification with severity level of INFO.
             */
            $scope.newInfo = function () {
                notificationService.info({
                    title: "Example Info notification " + messageCounter++
                });
            };

        }

        return NotificationLaunchController;
    }
);
