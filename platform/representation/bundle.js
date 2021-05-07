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
    "./src/MCTInclude",
    "./src/MCTRepresentation",
    "./src/gestures/DragGesture",
    "./src/gestures/DropGesture",
    "./src/gestures/GestureProvider",
    "./src/gestures/GestureRepresenter",
    "./src/services/DndService",
    "./src/TemplateLinker",
    "./src/TemplatePrefetcher"
], function (
    MCTInclude,
    MCTRepresentation,
    DragGesture,
    DropGesture,
    GestureProvider,
    GestureRepresenter,
    DndService,
    TemplateLinker,
    TemplatePrefetcher
) {

    return {
        name: "platform/representation",
        definition: {
            "extensions": {
                "directives": [
                    {
                        "key": "mctInclude",
                        "implementation": MCTInclude,
                        "depends": [
                            "templates[]",
                            "templateLinker"
                        ]
                    },
                    {
                        "key": "mctRepresentation",
                        "implementation": MCTRepresentation,
                        "depends": [
                            "representations[]",
                            "views[]",
                            "representers[]",
                            "$q",
                            "templateLinker",
                            "$log"
                        ]
                    }
                ],
                "gestures": [
                    {
                        "key": "drag",
                        "implementation": DragGesture,
                        "depends": [
                            "$log",
                            "dndService"
                        ]
                    },
                    {
                        "key": "drop",
                        "implementation": DropGesture,
                        "depends": [
                            "dndService",
                            "$q"
                        ]
                    }
                ],
                "components": [
                    {
                        "provides": "gestureService",
                        "type": "provider",
                        "implementation": GestureProvider,
                        "depends": [
                            "gestures[]"
                        ]
                    }
                ],
                "representers": [
                    {
                        "implementation": GestureRepresenter,
                        "depends": [
                            "gestureService"
                        ]
                    }
                ],
                "services": [
                    {
                        "key": "dndService",
                        "implementation": DndService,
                        "depends": [
                            "$log"
                        ]
                    },
                    {
                        "key": "templateLinker",
                        "implementation": TemplateLinker,
                        "depends": [
                            "$templateRequest",
                            "$sce",
                            "$compile",
                            "$log"
                        ],
                        "comment": "For internal use by mct-include and mct-representation."
                    }
                ],
                "runs": [
                    {
                        "priority": "mandatory",
                        "implementation": TemplatePrefetcher,
                        "depends": [
                            "templateLinker",
                            "templates[]",
                            "views[]",
                            "representations[]",
                            "controls[]",
                            "containers[]"
                        ]
                    }
                ]
            }
        }
    };
});
