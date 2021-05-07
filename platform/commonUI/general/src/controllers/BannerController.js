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

        /**
         * A controller for banner notifications. Banner notifications are a
         * non-blocking way of drawing the user's attention to an event such
         * as system errors, or the progress or successful completion of an
         * ongoing task. This controller provides scoped functions for
         * dismissing and 'maximizing' notifications. See {@link NotificationService}
         * for more details on Notifications.
         *
         * @param $scope
         * @param notificationService
         * @param dialogService
         * @constructor
         */
        function BannerController($scope, notificationService, dialogService) {
            $scope.active = notificationService.active;

            $scope.action = function (action, $event) {
                /*
                 Prevents default 'maximize' behaviour when clicking on
                  notification button
                 */
                $event.stopPropagation();

                return action();
            };

            $scope.dismiss = function (notification, $event) {
                $event.stopPropagation();
                notification.dismiss();
            };

            $scope.maximize = function (notification) {
                if (notification.model.severity !== "info") {
                    var dialog;
                    notification.model.cancel = function () {
                        dialog.dismiss();
                    };

                    //If the notification is dismissed by the user, close
                    // the dialog.
                    notification.on('dismiss', function () {
                        dialog.dismiss();
                    });

                    dialog = dialogService.showBlockingMessage(notification.model);
                }
            };
        }

        return BannerController;
    });
