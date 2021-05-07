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

define([
    "./src/DialogService",
    "./src/OverlayService",
    "./res/templates/overlay-dialog.html",
    "./res/templates/overlay-options.html",
    "./res/templates/dialog.html",
    "./res/templates/overlay-blocking-message.html",
    "./res/templates/message.html",
    "./res/templates/notification-message.html",
    "./res/templates/overlay-message-list.html",
    "./res/templates/overlay.html"
], function (
    DialogService,
    OverlayService,
    overlayDialogTemplate,
    overlayOptionsTemplate,
    dialogTemplate,
    overlayBlockingMessageTemplate,
    messageTemplate,
    notificationMessageTemplate,
    overlayMessageListTemplate,
    overlayTemplate
) {

    return {
        name: "platform/commonUI/dialog",
        definition: {
            "extensions": {
                "services": [
                    {
                        "key": "dialogService",
                        "implementation": DialogService,
                        "depends": [
                            "overlayService",
                            "$q",
                            "$log",
                            "$document"
                        ]
                    },
                    {
                        "key": "overlayService",
                        "implementation": OverlayService,
                        "depends": [
                            "$document",
                            "$compile",
                            "$rootScope",
                            "$timeout"
                        ]
                    }
                ],
                "templates": [
                    {
                        "key": "overlay-dialog",
                        "template": overlayDialogTemplate
                    },
                    {
                        "key": "overlay-options",
                        "template": overlayOptionsTemplate
                    },
                    {
                        "key": "form-dialog",
                        "template": dialogTemplate
                    },
                    {
                        "key": "overlay-blocking-message",
                        "template": overlayBlockingMessageTemplate
                    },
                    {
                        "key": "message",
                        "template": messageTemplate
                    },
                    {
                        "key": "notification-message",
                        "template": notificationMessageTemplate
                    },
                    {
                        "key": "overlay-message-list",
                        "template": overlayMessageListTemplate
                    }
                ],
                "containers": [
                    {
                        "key": "overlay",
                        "template": overlayTemplate
                    }
                ]
            }
        }
    };
});
