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
    "./src/controllers/SearchController",
    "./src/controllers/SearchMenuController",
    "./src/services/GenericSearchProvider",
    "./src/services/SearchAggregator",
    "./res/templates/search-item.html",
    "./res/templates/search.html",
    "./res/templates/search-menu.html",
    "raw-loader!./src/services/GenericSearchWorker.js",
    "raw-loader!./src/services/BareBonesSearchWorker.js"
], function (
    SearchController,
    SearchMenuController,
    GenericSearchProvider,
    SearchAggregator,
    searchItemTemplate,
    searchTemplate,
    searchMenuTemplate,
    searchWorkerText,
    BareBonesSearchWorkerText
) {

    return {
        name: "platform/search",
        definition: {
            "name": "Search",
            "description": "Allows the user to search through the file tree.",
            "extensions": {
                "constants": [
                    {
                        "key": "GENERIC_SEARCH_ROOTS",
                        "value": [
                            "ROOT"
                        ],
                        "priority": "fallback"
                    },
                    {
                        "key": "USE_LEGACY_INDEXER",
                        "value": false,
                        "priority": 2
                    }
                ],
                "controllers": [
                    {
                        "key": "SearchController",
                        "implementation": SearchController,
                        "depends": [
                            "$scope",
                            "searchService"
                        ]
                    },
                    {
                        "key": "SearchMenuController",
                        "implementation": SearchMenuController,
                        "depends": [
                            "$scope",
                            "types[]"
                        ]
                    }
                ],
                "representations": [
                    {
                        "key": "search-item",
                        "template": searchItemTemplate
                    }
                ],
                "templates": [
                    {
                        "key": "search",
                        "template": searchTemplate
                    },
                    {
                        "key": "search-menu",
                        "template": searchMenuTemplate
                    }
                ],
                "components": [
                    {
                        "provides": "searchService",
                        "type": "provider",
                        "implementation": GenericSearchProvider,
                        "depends": [
                            "$q",
                            "$log",
                            "objectService",
                            "workerService",
                            "topic",
                            "GENERIC_SEARCH_ROOTS",
                            "USE_LEGACY_INDEXER",
                            "openmct"
                        ]
                    },
                    {
                        "provides": "searchService",
                        "type": "aggregator",
                        "implementation": SearchAggregator,
                        "depends": [
                            "$q",
                            "objectService"
                        ]
                    }
                ],
                "workers": [
                    {
                        "key": "bareBonesSearchWorker",
                        "scriptText": BareBonesSearchWorkerText
                    },
                    {
                        "key": "genericSearchWorker",
                        "scriptText": searchWorkerText
                    }
                ]
            }
        }
    };
});
