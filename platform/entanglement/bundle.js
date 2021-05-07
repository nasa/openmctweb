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
    "./src/actions/LinkAction",
    "./src/actions/SetPrimaryLocationAction",
    "./src/services/LocatingCreationDecorator",
    "./src/services/LocatingObjectDecorator",
    "./src/policies/CopyPolicy",
    "./src/policies/CrossSpacePolicy",
    "./src/capabilities/LocationCapability",
    "./src/services/LinkService",
    "./src/services/CopyService",
    "./src/services/LocationService"
], function (
    LinkAction,
    SetPrimaryLocationAction,
    LocatingCreationDecorator,
    LocatingObjectDecorator,
    CopyPolicy,
    CrossSpacePolicy,
    LocationCapability,
    LinkService,
    CopyService,
    LocationService
) {

    return {
        name: "platform/entanglement",
        definition: {
            "name": "Entanglement",
            "description": "Tools to assist you in entangling the world of WARP.",
            "configuration": {},
            "extensions": {
                "actions": [
                    {
                        "key": "link",
                        "name": "Create Link",
                        "description": "Create Link to object in another location.",
                        "cssClass": "icon-link",
                        "category": "contextual",
                        "group": "action",
                        "priority": 7,
                        "implementation": LinkAction,
                        "depends": [
                            "policyService",
                            "locationService",
                            "linkService"
                        ]
                    },
                    {
                        "key": "locate",
                        "name": "Set Primary Location",
                        "description": "Set a domain object's primary location.",
                        "cssClass": "",
                        "category": "contextual",
                        "implementation": SetPrimaryLocationAction
                    }
                ],
                "components": [
                    {
                        "type": "decorator",
                        "provides": "creationService",
                        "implementation": LocatingCreationDecorator
                    },
                    {
                        "type": "decorator",
                        "provides": "objectService",
                        "implementation": LocatingObjectDecorator,
                        "depends": [
                            "$q",
                            "$log"
                        ]
                    }
                ],
                "policies": [
                    {
                        "category": "action",
                        "implementation": CrossSpacePolicy
                    },
                    {
                        "category": "action",
                        "implementation": CopyPolicy
                    }
                ],
                "capabilities": [
                    {
                        "key": "location",
                        "name": "Location Capability",
                        "description": "Provides a capability for retrieving the location of an object based upon it's context.",
                        "implementation": LocationCapability,
                        "depends": [
                            "$q",
                            "$injector"
                        ]
                    }
                ],
                "services": [
                    {
                        "key": "linkService",
                        "name": "Link Service",
                        "description": "Provides a service for linking objects",
                        "implementation": LinkService,
                        "depends": [
                            "openmct"
                        ]
                    },
                    {
                        "key": "copyService",
                        "name": "Copy Service",
                        "description": "Provides a service for copying objects",
                        "implementation": CopyService,
                        "depends": [
                            "$q",
                            "policyService",
                            "openmct"
                        ]
                    },
                    {
                        "key": "locationService",
                        "name": "Location Service",
                        "description": "Provides a service for prompting a user for locations.",
                        "implementation": LocationService,
                        "depends": [
                            "dialogService"
                        ]
                    }
                ],
                "licenses": []
            }
        }
    };
});
