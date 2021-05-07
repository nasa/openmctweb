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
    "./src/services/UrlService",
    "./src/services/PopupService",
    "./src/SplashScreenManager",
    "./src/StyleSheetLoader",
    "./src/controllers/TimeRangeController",
    "./src/controllers/DateTimePickerController",
    "./src/controllers/DateTimeFieldController",
    "./src/controllers/TreeNodeController",
    "./src/controllers/ActionGroupController",
    "./src/controllers/ToggleController",
    "./src/controllers/ClickAwayController",
    "./src/controllers/ViewSwitcherController",
    "./src/controllers/GetterSetterController",
    "./src/controllers/SelectorController",
    "./src/controllers/ObjectInspectorController",
    "./src/controllers/BannerController",
    "./src/directives/MCTContainer",
    "./src/directives/MCTDrag",
    "./src/directives/MCTSelectable",
    "./src/directives/MCTClickElsewhere",
    "./src/directives/MCTResize",
    "./src/directives/MCTPopup",
    "./src/directives/MCTScroll",
    "./src/directives/MCTSplitPane",
    "./src/directives/MCTSplitter",
    "./src/directives/MCTTree",
    "./src/directives/MCTIndicators",
    "./src/filters/ReverseFilter",
    "./res/templates/bottombar.html",
    "./res/templates/controls/action-button.html",
    "./res/templates/controls/input-filter.html",
    "./res/templates/angular-indicator.html",
    "./res/templates/message-banner.html",
    "./res/templates/progress-bar.html",
    "./res/templates/controls/time-controller.html",
    "./res/templates/containers/accordion.html",
    "./res/templates/subtree.html",
    "./res/templates/tree.html",
    "./res/templates/tree-node.html",
    "./res/templates/label.html",
    "./res/templates/controls/action-group.html",
    "./res/templates/controls/switcher.html",
    "./res/templates/object-inspector.html",
    "./res/templates/controls/selector.html",
    "./res/templates/controls/datetime-picker.html",
    "./res/templates/controls/datetime-field.html"
], function (
    UrlService,
    PopupService,
    SplashScreenManager,
    StyleSheetLoader,
    TimeRangeController,
    DateTimePickerController,
    DateTimeFieldController,
    TreeNodeController,
    ActionGroupController,
    ToggleController,
    ClickAwayController,
    ViewSwitcherController,
    GetterSetterController,
    SelectorController,
    ObjectInspectorController,
    BannerController,
    MCTContainer,
    MCTDrag,
    MCTSelectable,
    MCTClickElsewhere,
    MCTResize,
    MCTPopup,
    MCTScroll,
    MCTSplitPane,
    MCTSplitter,
    MCTTree,
    MCTIndicators,
    ReverseFilter,
    bottombarTemplate,
    actionButtonTemplate,
    inputFilterTemplate,
    indicatorTemplate,
    messageBannerTemplate,
    progressBarTemplate,
    timeControllerTemplate,
    accordionTemplate,
    subtreeTemplate,
    treeTemplate,
    treeNodeTemplate,
    labelTemplate,
    actionGroupTemplate,
    switcherTemplate,
    objectInspectorTemplate,
    selectorTemplate,
    datetimePickerTemplate,
    datetimeFieldTemplate
) {

    return {
        name: "platform/commonUI/general",
        definition: {
            "name": "General UI elements",
            "description": "General UI elements, meant to be reused across modes",
            "resources": "res",
            "extensions": {
                "services": [
                    {
                        "key": "urlService",
                        "implementation": UrlService,
                        "depends": [
                            "$location"
                        ]
                    },
                    {
                        "key": "popupService",
                        "implementation": PopupService,
                        "depends": [
                            "$document",
                            "$window"
                        ]
                    }
                ],
                "runs": [
                    {
                        "implementation": StyleSheetLoader,
                        "depends": [
                            "stylesheets[]",
                            "$document",
                            "THEME",
                            "ASSETS_PATH"
                        ]
                    },
                    {
                        "implementation": SplashScreenManager,
                        "depends": [
                            "$document"
                        ]
                    }
                ],
                "filters": [
                    {
                        "implementation": ReverseFilter,
                        "key": "reverse"
                    }
                ],
                "templates": [
                    {
                        "key": "bottombar",
                        "template": bottombarTemplate
                    },
                    {
                        "key": "action-button",
                        "template": actionButtonTemplate
                    },
                    {
                        "key": "input-filter",
                        "template": inputFilterTemplate
                    },
                    {
                        "key": "indicator",
                        "template": indicatorTemplate
                    },
                    {
                        "key": "message-banner",
                        "template": messageBannerTemplate
                    },
                    {
                        "key": "progress-bar",
                        "template": progressBarTemplate
                    },
                    {
                        "key": "time-controller",
                        "template": timeControllerTemplate
                    }
                ],
                "controllers": [
                    {
                        "key": "TimeRangeController",
                        "implementation": TimeRangeController,
                        "depends": [
                            "$scope",
                            "$timeout",
                            "formatService",
                            "DEFAULT_TIME_FORMAT",
                            "now"
                        ]
                    },
                    {
                        "key": "DateTimePickerController",
                        "implementation": DateTimePickerController,
                        "depends": [
                            "$scope",
                            "now"
                        ]
                    },
                    {
                        "key": "DateTimeFieldController",
                        "implementation": DateTimeFieldController,
                        "depends": [
                            "$scope",
                            "formatService",
                            "DEFAULT_TIME_FORMAT"
                        ]
                    },
                    {
                        "key": "TreeNodeController",
                        "implementation": TreeNodeController,
                        "depends": [
                            "$scope",
                            "$timeout",
                            "navigationService"
                        ]
                    },
                    {
                        "key": "ActionGroupController",
                        "implementation": ActionGroupController,
                        "depends": [
                            "$scope"
                        ]
                    },
                    {
                        "key": "ToggleController",
                        "implementation": ToggleController
                    },
                    {
                        "key": "ClickAwayController",
                        "implementation": ClickAwayController,
                        "depends": [
                            "$document",
                            "$timeout"
                        ]
                    },
                    {
                        "key": "ViewSwitcherController",
                        "implementation": ViewSwitcherController,
                        "depends": [
                            "$scope",
                            "$timeout"
                        ]
                    },
                    {
                        "key": "GetterSetterController",
                        "implementation": GetterSetterController,
                        "depends": [
                            "$scope"
                        ]
                    },
                    {
                        "key": "SelectorController",
                        "implementation": SelectorController,
                        "depends": [
                            "objectService",
                            "$scope"
                        ]
                    },
                    {
                        "key": "ObjectInspectorController",
                        "implementation": ObjectInspectorController,
                        "depends": [
                            "$scope",
                            "objectService"
                        ]
                    },
                    {
                        "key": "BannerController",
                        "implementation": BannerController,
                        "depends": [
                            "$scope",
                            "notificationService",
                            "dialogService"
                        ]
                    }
                ],
                "directives": [
                    {
                        "key": "mctContainer",
                        "implementation": MCTContainer,
                        "depends": [
                            "containers[]"
                        ]
                    },
                    {
                        "key": "mctDrag",
                        "implementation": MCTDrag,
                        "depends": [
                            "$document",
                            "agentService"
                        ]
                    },
                    {
                        "key": "mctSelectable",
                        "implementation": MCTSelectable,
                        "depends": [
                            "openmct"
                        ]
                    },
                    {
                        "key": "mctClickElsewhere",
                        "implementation": MCTClickElsewhere,
                        "depends": [
                            "$document"
                        ]
                    },
                    {
                        "key": "mctResize",
                        "implementation": MCTResize,
                        "depends": [
                            "$timeout"
                        ]
                    },
                    {
                        "key": "mctPopup",
                        "implementation": MCTPopup,
                        "depends": [
                            "$compile",
                            "popupService"
                        ]
                    },
                    {
                        "key": "mctScrollX",
                        "implementation": MCTScroll,
                        "depends": [
                            "$parse",
                            "MCT_SCROLL_X_PROPERTY",
                            "MCT_SCROLL_X_ATTRIBUTE"
                        ]
                    },
                    {
                        "key": "mctScrollY",
                        "implementation": MCTScroll,
                        "depends": [
                            "$parse",
                            "MCT_SCROLL_Y_PROPERTY",
                            "MCT_SCROLL_Y_ATTRIBUTE"
                        ]
                    },
                    {
                        "key": "mctSplitPane",
                        "implementation": MCTSplitPane,
                        "depends": [
                            "$parse",
                            "$log",
                            "$interval",
                            "$window"
                        ]
                    },
                    {
                        "key": "mctSplitter",
                        "implementation": MCTSplitter
                    },
                    {
                        "key": "mctTree",
                        "implementation": MCTTree,
                        "depends": ['gestureService', 'openmct']
                    },
                    {
                        "key": "mctIndicators",
                        "implementation": MCTIndicators,
                        "depends": ['openmct']
                    }
                ],
                "constants": [
                    {
                        "key": "MCT_SCROLL_X_PROPERTY",
                        "value": "scrollLeft"
                    },
                    {
                        "key": "MCT_SCROLL_X_ATTRIBUTE",
                        "value": "mctScrollX"
                    },
                    {
                        "key": "MCT_SCROLL_Y_PROPERTY",
                        "value": "scrollTop"
                    },
                    {
                        "key": "MCT_SCROLL_Y_ATTRIBUTE",
                        "value": "mctScrollY"
                    },
                    {
                        "key": "THEME",
                        "value": "unspecified",
                        "priority": "fallback"
                    },
                    {
                        "key": "ASSETS_PATH",
                        "value": ".",
                        "priority": "fallback"
                    }
                ],
                "containers": [
                    {
                        "key": "accordion",
                        "template": accordionTemplate,
                        "attributes": [
                            "label"
                        ]
                    }
                ],
                "representations": [
                    {
                        "key": "tree",
                        "template": subtreeTemplate,
                        "uses": [
                            "composition"
                        ],
                        "type": "root",
                        "priority": "preferred"
                    },
                    {
                        "key": "tree",
                        "template": treeTemplate
                    },
                    {
                        "key": "subtree",
                        "template": subtreeTemplate,
                        "uses": [
                            "composition"
                        ]
                    },
                    {
                        "key": "tree-node",
                        "template": treeNodeTemplate,
                        "uses": [
                            "action"
                        ]
                    },
                    {
                        "key": "label",
                        "template": labelTemplate,
                        "uses": [
                            "type",
                            "location"
                        ],
                        "gestures": [
                            "drag",
                            "menu",
                            "info"
                        ]
                    },
                    {
                        "key": "node",
                        "template": labelTemplate,
                        "uses": [
                            "type"
                        ],
                        "gestures": [
                            "drag",
                            "menu"
                        ]
                    },
                    {
                        "key": "action-group",
                        "template": actionGroupTemplate,
                        "uses": [
                            "action"
                        ]
                    },
                    {
                        "key": "switcher",
                        "template": switcherTemplate,
                        "uses": [
                            "view"
                        ]
                    },
                    {
                        "key": "object-inspector",
                        "template": objectInspectorTemplate
                    }
                ],
                "controls": [
                    {
                        "key": "selector",
                        "template": selectorTemplate
                    },
                    {
                        "key": "datetime-picker",
                        "template": datetimePickerTemplate
                    },
                    {
                        "key": "datetime-field",
                        "template": datetimeFieldTemplate
                    }
                ],
                "licenses": [
                    {
                        "name": "Normalize.css",
                        "version": "1.1.2",
                        "description": "Browser style normalization",
                        "author": "Nicolas Gallagher, Jonathan Neal",
                        "website": "http://necolas.github.io/normalize.css/",
                        "copyright": "Copyright (c) Nicolas Gallagher and Jonathan Neal",
                        "license": "license-mit",
                        "link": "https://github.com/necolas/normalize.css/blob/v1.1.2/LICENSE.md"
                    },
                    {
                        "name": "Zepto",
                        "version": "1.1.6",
                        "description": "DOM manipulation",
                        "author": "Thomas Fuchs",
                        "website": "http://zeptojs.com/",
                        "copyright": "Copyright (c) 2010-2016 Thomas Fuchs",
                        "license": "license-mit",
                        "link": "https://github.com/madrobby/zepto/blob/master/MIT-LICENSE"
                    }
                ]
            }
        }
    };
});
