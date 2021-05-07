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
    "./src/actions/ExportAsJSONAction",
    "./src/actions/ImportAsJSONAction"
], function (
    ExportAsJSONAction,
    ImportAsJSONAction
) {

    return function ImportExportPlugin() {
        return function (openmct) {
            ExportAsJSONAction.appliesTo = function (context) {
                return openmct.$injector.get('policyService')
                    .allow("creation", context.domainObject.getCapability("type")
                    );
            };

            openmct.legacyRegistry.register("platform/import-export", {
                "name": "Import-export plugin",
                "description": "Allows importing / exporting of domain objects as JSON.",
                "extensions": {
                    "actions": [
                        {
                            "key": "export.JSON",
                            "name": "Export as JSON",
                            "implementation": ExportAsJSONAction,
                            "category": "contextual",
                            "cssClass": "icon-export",
                            "group": "json",
                            "priority": 2,
                            "depends": [
                                "openmct",
                                "exportService",
                                "policyService",
                                "identifierService",
                                "typeService"
                            ]
                        },
                        {
                            "key": "import.JSON",
                            "name": "Import from JSON",
                            "implementation": ImportAsJSONAction,
                            "category": "contextual",
                            "cssClass": "icon-import",
                            "group": "json",
                            "priority": 2,
                            "depends": [
                                "exportService",
                                "identifierService",
                                "dialogService",
                                "openmct"
                            ]
                        }
                    ]
                }
            });

            openmct.legacyRegistry.enable('platform/import-export');
        };
    };
});
