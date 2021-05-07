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
    "./src/navigation/NavigationService",
    "./src/navigation/NavigateAction",
    "./src/navigation/OrphanNavigationHandler",
    "./src/windowing/NewTabAction",
    "./res/templates/browse.html",
    "./res/templates/browse-object.html",
    "./res/templates/browse/object-header.html",
    "./res/templates/browse/object-header-frame.html",
    "./res/templates/menu-arrow.html",
    "./res/templates/back-arrow.html",
    "./res/templates/browse/object-properties.html",
    "./res/templates/browse/inspector-region.html"
], function (
    NavigationService,
    NavigateAction,
    OrphanNavigationHandler,
    NewTabAction,
    browseTemplate,
    browseObjectTemplate,
    objectHeaderTemplate,
    objectHeaderFrameTemplate,
    menuArrowTemplate,
    backArrowTemplate,
    objectPropertiesTemplate,
    inspectorRegionTemplate
) {

    return {
        name: "platform/commonUI/browse",
        definition: {
            "extensions": {
                "routes": [
                ],
                "constants": [
                    {
                        "key": "DEFAULT_PATH",
                        "value": "mine",
                        "priority": "fallback"
                    }
                ],
                "representations": [
                    {
                        "key": "browse-object",
                        "template": browseObjectTemplate,
                        "gestures": [
                            "drop"
                        ],
                        "uses": [
                            "view"
                        ]
                    },
                    {
                        "key": "object-header",
                        "template": objectHeaderTemplate,
                        "uses": [
                            "type"
                        ]
                    },
                    {
                        "key": "object-header-frame",
                        "template": objectHeaderFrameTemplate,
                        "uses": [
                            "type"
                        ]
                    },
                    {
                        "key": "menu-arrow",
                        "template": menuArrowTemplate,
                        "uses": [
                            "action"
                        ],
                        "gestures": [
                            "menu"
                        ]
                    },
                    {
                        "key": "back-arrow",
                        "uses": [
                            "context"
                        ],
                        "template": backArrowTemplate
                    },
                    {
                        "key": "object-properties",
                        "template": objectPropertiesTemplate
                    },
                    {
                        "key": "inspector-region",
                        "template": inspectorRegionTemplate
                    }
                ],
                "services": [
                    {
                        "key": "navigationService",
                        "implementation": NavigationService,
                        "depends": [
                            "$window"
                        ]
                    }
                ],
                "actions": [
                    {
                        "key": "navigate",
                        "implementation": NavigateAction,
                        "depends": [
                            "navigationService"
                        ]
                    },
                    {
                        "key": "window",
                        "name": "Open In New Tab",
                        "implementation": NewTabAction,
                        "description": "Open in a new browser tab",
                        "category": [
                            "view-control",
                            "contextual"
                        ],
                        "depends": [
                            "urlService",
                            "$window"
                        ],
                        "group": "windowing",
                        "priority": 10,
                        "cssClass": "icon-new-window"
                    }
                ],
                "runs": [
                    {
                        "implementation": OrphanNavigationHandler,
                        "depends": [
                            "throttle",
                            "topic",
                            "navigationService"
                        ]
                    }
                ],
                "templates": [
                    {
                        key: "browseRoot",
                        template: browseTemplate
                    },
                    {
                        key: "browseObject",
                        template: browseObjectTemplate
                    },
                    {
                        key: "inspectorRegion",
                        template: inspectorRegionTemplate
                    }
                ]
            }
        }
    };
});
