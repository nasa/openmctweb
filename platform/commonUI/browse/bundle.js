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

define([
    "./src/BrowseController",
    "./src/PaneController",
    "./src/InspectorPaneController",
    "./src/BrowseObjectController",
    "./src/MenuArrowController",
    "./src/navigation/NavigationService",
    "./src/navigation/NavigateAction",
    "./src/navigation/OrphanNavigationHandler",
    "./src/windowing/NewTabAction",
    "./src/windowing/FullscreenAction",
    "./src/windowing/WindowTitler",
    "text!./res/templates/browse.html",
    "text!./res/templates/browse-object.html",
    "text!./res/templates/items/grid-item.html",
    "text!./res/templates/browse/object-header.html",
    "text!./res/templates/menu-arrow.html",
    "text!./res/templates/back-arrow.html",
    "text!./res/templates/items/items.html",
    "text!./res/templates/browse/object-properties.html",
    "text!./res/templates/browse/object-notes.html",
    "text!./res/templates/browse/inspector-region.html",
    'legacyRegistry'
], function (
    BrowseController,
    PaneController,
    InspectorPaneController,
    BrowseObjectController,
    MenuArrowController,
    NavigationService,
    NavigateAction,
    OrphanNavigationHandler,
    NewTabAction,
    FullscreenAction,
    WindowTitler,
    browseTemplate,
    browseObjectTemplate,
    gridItemTemplate,
    objectHeaderTemplate,
    menuArrowTemplate,
    backArrowTemplate,
    itemsTemplate,
    objectPropertiesTemplate,
    objectNotesTemplate,
    inspectorRegionTemplate,
    legacyRegistry
) {

    legacyRegistry.register("platform/commonUI/browse", {
        "extensions": {
            "routes": [
                {
                    "when": "/browse/:ids*?",
                    "template": browseTemplate,
                    "reloadOnSearch": false
                },
                {
                    "when": "",
                    "redirectTo": "/browse/"
                }
            ],
            "constants": [
                {
                    "key": "DEFAULT_PATH",
                    "value": "mine",
                    "priority": "fallback"
                }
            ],
            "controllers": [
                {
                    "key": "BrowseController",
                    "implementation": BrowseController,
                    "depends": [
                        "$scope",
                        "$route",
                        "$location",
                        "objectService",
                        "navigationService",
                        "urlService",
                        "DEFAULT_PATH"
                    ]
                },
                {
                    "key": "PaneController",
                    "implementation": PaneController,
                    "priority": "preferred",
                    "depends": [
                        "$scope",
                        "agentService",
                        "$window"
                    ]
                },
                {
                    "key": "BrowseObjectController",
                    "implementation": BrowseObjectController,
                    "depends": [
                        "$scope",
                        "$location",
                        "$route"
                    ]
                },
                {
                    "key": "MenuArrowController",
                    "implementation": MenuArrowController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "InspectorPaneController",
                    "implementation": InspectorPaneController,
                    "priority": "preferred",
                    "depends": [
                        "$scope",
                        "agentService",
                        "$window",
                        "navigationService"
                    ]
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
                    "key": "grid-item",
                    "template": gridItemTemplate,
                    "uses": [
                        "type",
                        "action",
                        "location"
                    ],
                    "gestures": [
                        "info",
                        "menu"
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
                    "key": "object-notes",
                    "template": objectNotesTemplate
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
                    "cssclass": "icon-new-window",
                    "priority": "preferred"
                },
                {
                    "key": "fullscreen",
                    "implementation": FullscreenAction,
                    "category": "view-control",
                    "group": "windowing",
                    "priority": "default"
                }
            ],
            "views": [
                {
                    "key": "items",
                    "name": "Items",
                    "cssclass": "icon-thumbs-strip",
                    "description": "Grid of available items",
                    "template": itemsTemplate,
                    "uses": [
                        "composition"
                    ],
                    "gestures": [
                        "drop"
                    ],
                    "type": "folder",
                    "editable": false
                }
            ],
            "runs": [
                {
                    "implementation": WindowTitler,
                    "depends": [
                        "navigationService",
                        "$rootScope",
                        "$document"
                    ]
                },
                {
                    "implementation": OrphanNavigationHandler,
                    "depends": [
                        "throttle",
                        "topic",
                        "navigationService"
                    ]
                }
            ],
            "licenses": [
                {
                    "name": "screenfull.js",
                    "version": "1.2.0",
                    "description": "Wrapper for cross-browser usage of fullscreen API",
                    "author": "Sindre Sorhus",
                    "website": "https://github.com/sindresorhus/screenfull.js/",
                    "copyright": "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)",
                    "license": "license-mit",
                    "link": "https://github.com/sindresorhus/screenfull.js/blob/gh-pages/license"
                }
            ]
        }
    });
});
