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
    "./src/objects/DomainObjectProvider",
    "./src/capabilities/CoreCapabilityProvider",
    "./src/models/StaticModelProvider",
    "./src/models/ModelAggregator",
    "./src/models/ModelCacheService",
    "./src/models/PersistedModelProvider",
    "./src/models/CachingModelDecorator",
    "./src/models/MissingModelDecorator",
    "./src/types/TypeProvider",
    "./src/actions/ActionProvider",
    "./src/actions/ActionAggregator",
    "./src/actions/LoggingActionDecorator",
    "./src/views/ViewProvider",
    "./src/identifiers/IdentifierProvider",
    "./src/capabilities/CompositionCapability",
    "./src/capabilities/RelationshipCapability",
    "./src/types/TypeCapability",
    "./src/actions/ActionCapability",
    "./src/views/ViewCapability",
    "./src/capabilities/PersistenceCapability",
    "./src/capabilities/MetadataCapability",
    "./src/capabilities/MutationCapability",
    "./src/capabilities/DelegationCapability",
    "./src/capabilities/InstantiationCapability",
    "./src/runs/TransactingMutationListener",
    "./src/services/Now",
    "./src/services/Throttle",
    "./src/services/Topic",
    "./src/services/Instantiate"
], function (
    DomainObjectProvider,
    CoreCapabilityProvider,
    StaticModelProvider,
    ModelAggregator,
    ModelCacheService,
    PersistedModelProvider,
    CachingModelDecorator,
    MissingModelDecorator,
    TypeProvider,
    ActionProvider,
    ActionAggregator,
    LoggingActionDecorator,
    ViewProvider,
    IdentifierProvider,
    CompositionCapability,
    RelationshipCapability,
    TypeCapability,
    ActionCapability,
    ViewCapability,
    PersistenceCapability,
    MetadataCapability,
    MutationCapability,
    DelegationCapability,
    InstantiationCapability,
    TransactingMutationListener,
    Now,
    Throttle,
    Topic,
    Instantiate
) {

    return {
        name: "platform/core",
        definition: {
            "name": "Open MCT Core",
            "description": "Defines core concepts of Open MCT.",
            "sources": "src",
            "configuration": {
                "paths": {
                    "uuid": "uuid"
                }
            },
            "extensions": {
                "components": [
                    {
                        "provides": "objectService",
                        "type": "provider",
                        "implementation": DomainObjectProvider,
                        "depends": [
                            "modelService",
                            "instantiate"
                        ]
                    },
                    {
                        "provides": "capabilityService",
                        "type": "provider",
                        "implementation": CoreCapabilityProvider,
                        "depends": [
                            "capabilities[]",
                            "$log"
                        ]
                    },
                    {
                        "provides": "modelService",
                        "type": "provider",
                        "implementation": StaticModelProvider,
                        "depends": [
                            "models[]",
                            "$q",
                            "$log"
                        ]
                    },
                    {
                        "provides": "modelService",
                        "type": "aggregator",
                        "implementation": ModelAggregator,
                        "depends": [
                            "$q"
                        ]
                    },
                    {
                        "provides": "modelService",
                        "type": "provider",
                        "implementation": PersistedModelProvider,
                        "depends": [
                            "persistenceService",
                            "$q",
                            "now",
                            "PERSISTENCE_SPACE"
                        ]
                    },
                    {
                        "provides": "modelService",
                        "type": "decorator",
                        "implementation": CachingModelDecorator,
                        "depends": [
                            "cacheService"
                        ]
                    },
                    {
                        "provides": "modelService",
                        "type": "decorator",
                        "priority": "fallback",
                        "implementation": MissingModelDecorator
                    },
                    {
                        "provides": "typeService",
                        "type": "provider",
                        "implementation": TypeProvider,
                        "depends": [
                            "types[]"
                        ]
                    },
                    {
                        "provides": "actionService",
                        "type": "provider",
                        "implementation": ActionProvider,
                        "depends": [
                            "actions[]",
                            "$log"
                        ]
                    },
                    {
                        "provides": "actionService",
                        "type": "aggregator",
                        "implementation": ActionAggregator
                    },
                    {
                        "provides": "actionService",
                        "type": "decorator",
                        "implementation": LoggingActionDecorator,
                        "depends": [
                            "$log"
                        ]
                    },
                    {
                        "provides": "viewService",
                        "type": "provider",
                        "implementation": ViewProvider,
                        "depends": [
                            "views[]",
                            "$log"
                        ]
                    },
                    {
                        "provides": "identifierService",
                        "type": "provider",
                        "implementation": IdentifierProvider,
                        "depends": [
                            "PERSISTENCE_SPACE"
                        ]
                    }
                ],
                "types": [
                    {
                        "properties": [
                            {
                                "control": "textfield",
                                "name": "Title",
                                "key": "name",
                                "property": "name",
                                "pattern": "\\S+",
                                "required": true,
                                "cssClass": "l-input-lg"
                            },
                            {
                                "name": "Notes",
                                "key": "notes",
                                "property": "notes",
                                "control": "textarea",
                                "required": false,
                                "cssClass": "l-textarea-sm"
                            }
                        ]
                    },
                    {
                        "key": "root",
                        "name": "Root",
                        "cssClass": "icon-folder"
                    },
                    {
                        "key": "folder",
                        "name": "Folder",
                        "cssClass": "icon-folder",
                        "features": "creation",
                        "description": "Create folders to organize other objects or links to objects.",
                        "priority": 1000,
                        "model": {
                            "composition": []
                        }
                    },
                    {
                        "key": "unknown",
                        "name": "Unknown Type",
                        "cssClass": "icon-object-unknown"
                    },
                    {
                        "name": "Unknown Type",
                        "cssClass": "icon-object-unknown"
                    }
                ],
                "capabilities": [
                    {
                        "key": "composition",
                        "implementation": CompositionCapability,
                        "depends": [
                            "$injector"
                        ]
                    },
                    {
                        "key": "relationship",
                        "implementation": RelationshipCapability,
                        "depends": [
                            "$injector"
                        ]
                    },
                    {
                        "key": "type",
                        "implementation": TypeCapability,
                        "depends": [
                            "typeService"
                        ]
                    },
                    {
                        "key": "action",
                        "implementation": ActionCapability,
                        "depends": [
                            "$q",
                            "actionService"
                        ]
                    },
                    {
                        "key": "view",
                        "implementation": ViewCapability,
                        "depends": [
                            "viewService"
                        ]
                    },
                    {
                        "key": "persistence",
                        "implementation": PersistenceCapability,
                        "depends": [
                            "cacheService",
                            "persistenceService",
                            "identifierService",
                            "notificationService",
                            "$q",
                            "openmct"
                        ]
                    },
                    {
                        "key": "metadata",
                        "implementation": MetadataCapability
                    },
                    {
                        "key": "mutation",
                        "implementation": MutationCapability,
                        "depends": [
                            "topic",
                            "now"
                        ]
                    },
                    {
                        "key": "delegation",
                        "implementation": DelegationCapability,
                        "depends": [
                            "$q"
                        ]
                    },
                    {
                        "key": "instantiation",
                        "implementation": InstantiationCapability,
                        "depends": [
                            "$injector",
                            "identifierService",
                            "now"
                        ]
                    }
                ],
                "services": [
                    {
                        "key": "cacheService",
                        "implementation": ModelCacheService
                    },
                    {
                        "key": "now",
                        "implementation": Now
                    },
                    {
                        "key": "throttle",
                        "implementation": Throttle,
                        "depends": [
                            "$timeout"
                        ]
                    },
                    {
                        "key": "topic",
                        "implementation": Topic,
                        "depends": [
                            "$log"
                        ]
                    },
                    {
                        "key": "instantiate",
                        "implementation": Instantiate,
                        "depends": [
                            "capabilityService",
                            "identifierService",
                            "cacheService"
                        ]
                    }
                ],
                "runs": [
                    {
                        "implementation": TransactingMutationListener,
                        "depends": ["topic", "transactionService", "cacheService"]
                    }
                ],
                "constants": [
                    {
                        "key": "PERSISTENCE_SPACE",
                        "value": "mct"
                    }
                ],
                "licenses": [
                    {
                        "name": "Math.uuid.js",
                        "version": "1.4.7",
                        "description": "Unique identifer generation (code adapted.)",
                        "author": "Robert Kieffer",
                        "website": "https://github.com/broofa/node-uuid",
                        "copyright": "Copyright (c) 2010-2012 Robert Kieffer",
                        "license": "license-mit",
                        "link": "http://opensource.org/licenses/MIT"
                    }
                ]
            }
        }
    };
});
