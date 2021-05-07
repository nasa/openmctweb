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
    './actions/ActionDialogDecorator',
    './capabilities/AdapterCapability',
    './directives/MCTView',
    './services/Instantiate',
    './services/MissingModelCompatibilityDecorator',
    './capabilities/APICapabilityDecorator',
    './policies/AdaptedViewPolicy',
    './runs/AlternateCompositionInitializer',
    './runs/TypeDeprecationChecker',
    './runs/LegacyTelemetryProvider',
    './runs/RegisterLegacyTypes',
    './services/LegacyObjectAPIInterceptor',
    './views/installLegacyViews',
    './policies/LegacyCompositionPolicyAdapter',
    './actions/LegacyActionAdapter',
    './services/LegacyPersistenceAdapter'
], function (
    ActionDialogDecorator,
    AdapterCapability,
    MCTView,
    Instantiate,
    MissingModelCompatibilityDecorator,
    APICapabilityDecorator,
    AdaptedViewPolicy,
    AlternateCompositionInitializer,
    TypeDeprecationChecker,
    LegacyTelemetryProvider,
    RegisterLegacyTypes,
    LegacyObjectAPIInterceptor,
    installLegacyViews,
    legacyCompositionPolicyAdapter,
    LegacyActionAdapter,
    LegacyPersistenceAdapter
) {
    return {
        name: 'src/adapter',
        definition: {
            "extensions": {
                "directives": [
                    {
                        key: "mctView",
                        implementation: MCTView,
                        depends: ["openmct"]
                    }
                ],
                capabilities: [
                    {
                        key: "adapter",
                        implementation: AdapterCapability
                    }
                ],
                services: [
                    {
                        key: "instantiate",
                        priority: "mandatory",
                        implementation: Instantiate,
                        depends: [
                            "capabilityService",
                            "identifierService",
                            "cacheService"
                        ]
                    }
                ],
                components: [
                    {
                        type: "decorator",
                        provides: "capabilityService",
                        implementation: APICapabilityDecorator,
                        depends: [
                            "$injector"
                        ]
                    },
                    {
                        type: "decorator",
                        provides: "actionService",
                        implementation: ActionDialogDecorator,
                        depends: ["openmct"]
                    },
                    {
                        type: "decorator",
                        provides: "modelService",
                        implementation: MissingModelCompatibilityDecorator,
                        depends: ["openmct"]
                    },
                    {
                        provides: "objectService",
                        type: "decorator",
                        priority: "mandatory",
                        implementation: LegacyObjectAPIInterceptor,
                        depends: [
                            "openmct",
                            "roots[]",
                            "instantiate",
                            "topic"
                        ]
                    },
                    {
                        provides: "persistenceService",
                        type: "provider",
                        priority: "fallback",
                        implementation: function legacyPersistenceProvider(openmct) {
                            return new LegacyPersistenceAdapter.default(openmct);
                        },
                        depends: ["openmct"]
                    }
                ],
                policies: [
                    {
                        category: "view",
                        implementation: AdaptedViewPolicy,
                        depends: ["openmct"]
                    }
                ],
                runs: [
                    {
                        implementation: TypeDeprecationChecker,
                        depends: ["types[]"]
                    },
                    {
                        implementation: AlternateCompositionInitializer,
                        depends: ["openmct"]
                    },
                    {
                        implementation: LegacyTelemetryProvider,
                        depends: [
                            "openmct",
                            "instantiate"
                        ]
                    },
                    {
                        implementation: installLegacyViews,
                        depends: [
                            "openmct",
                            "views[]",
                            "instantiate"
                        ]
                    },
                    {
                        implementation: RegisterLegacyTypes,
                        depends: [
                            "types[]",
                            "openmct"
                        ]
                    },
                    {
                        implementation: legacyCompositionPolicyAdapter.default,
                        depends: [
                            "openmct"
                        ]
                    },
                    {
                        implementation: LegacyActionAdapter.default,
                        depends: [
                            "openmct",
                            "actions[]"
                        ]
                    }
                ],
                licenses: [
                    {
                        "name": "almond",
                        "version": "0.3.3",
                        "description": "Lightweight RequireJS replacement for builds",
                        "author": "jQuery Foundation",
                        "website": "https://github.com/requirejs/almond",
                        "copyright": "Copyright jQuery Foundation and other contributors, https://jquery.org/",
                        "license": "license-mit",
                        "link": "https://github.com/requirejs/almond/blob/master/LICENSE"
                    },
                    {
                        "name": "lodash",
                        "version": "3.10.1",
                        "description": "Utility functions",
                        "author": "Dojo Foundation",
                        "website": "https://lodash.com",
                        "copyright": "Copyright 2012-2015 The Dojo Foundation",
                        "license": "license-mit",
                        "link": "https://raw.githubusercontent.com/lodash/lodash/3.10.1/LICENSE"
                    },
                    {
                        "name": "EventEmitter3",
                        "version": "1.2.0",
                        "description": "Event-driven programming support",
                        "author": "Arnout Kazemier",
                        "website": "https://github.com/primus/eventemitter3",
                        "copyright": "Copyright (c) 2014 Arnout Kazemier",
                        "license": "license-mit",
                        "link": "https://github.com/primus/eventemitter3/blob/1.2.0/LICENSE"
                    }
                ]
            }
        }
    };
});
