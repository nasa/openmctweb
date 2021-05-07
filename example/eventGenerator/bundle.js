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
    "./src/EventTelemetryProvider"
], function (
    EventTelemetryProvider
) {
    "use strict";

    return {
        name: "example/eventGenerator",
        definition: {
            "name": "Event Message Generator",
            "description": "For development use. Creates sample event message data that mimics a live data stream.",
            "extensions": {
                "components": [
                    {
                        "implementation": EventTelemetryProvider,
                        "type": "provider",
                        "provides": "telemetryService",
                        "depends": [
                            "$q",
                            "$timeout"
                        ]
                    }
                ],
                "types": [
                    {
                        "key": "eventGenerator",
                        "name": "Event Message Generator",
                        "cssClass": "icon-generator-events",
                        "description": "For development use. Creates sample event message data that mimics a live data stream.",
                        "priority": 10,
                        "features": "creation",
                        "model": {
                            "telemetry": {}
                        },
                        "telemetry": {
                            "source": "eventGenerator",
                            "domains": [
                                {
                                    "key": "utc",
                                    "name": "Timestamp",
                                    "format": "utc"
                                }
                            ],
                            "ranges": [
                                {
                                    "key": "message",
                                    "name": "Message",
                                    "format": "string"
                                }
                            ]
                        }
                    }
                ]
            }
        }
    };
});
