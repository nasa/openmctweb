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
    "./src/ElasticPersistenceProvider",
    "./src/ElasticSearchProvider",
    "./src/ElasticIndicator"
], function (
    ElasticPersistenceProvider,
    ElasticSearchProvider,
    ElasticIndicator
) {

    return {
        name: "platform/persistence/elastic",
        definition: {
            "name": "ElasticSearch Persistence",
            "description": "Adapter to read and write objects using an ElasticSearch instance.",
            "extensions": {
                "components": [
                    {
                        "provides": "persistenceService",
                        "type": "provider",
                        "implementation": ElasticPersistenceProvider,
                        "depends": [
                            "$http",
                            "$q",
                            "PERSISTENCE_SPACE",
                            "ELASTIC_ROOT",
                            "ELASTIC_PATH"
                        ]
                    },
                    {
                        "provides": "searchService",
                        "type": "provider",
                        "implementation": ElasticSearchProvider,
                        "depends": [
                            "$http",
                            "ELASTIC_ROOT"
                        ]
                    }
                ],
                "constants": [
                    {
                        "key": "PERSISTENCE_SPACE",
                        "value": "mct"
                    },
                    {
                        "key": "ELASTIC_ROOT",
                        "value": "http://localhost:9200",
                        "priority": "fallback"
                    },
                    {
                        "key": "ELASTIC_PATH",
                        "value": "mct/_doc",
                        "priority": "fallback"
                    },
                    {
                        "key": "ELASTIC_INDICATOR_INTERVAL",
                        "value": 15000,
                        "priority": "fallback"
                    }
                ],
                "indicators": [
                    {
                        "implementation": ElasticIndicator,
                        "depends": [
                            "$http",
                            "$interval",
                            "ELASTIC_ROOT",
                            "ELASTIC_INDICATOR_INTERVAL"
                        ]
                    }
                ]
            }
        }
    };
});
