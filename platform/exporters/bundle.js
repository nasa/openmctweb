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
    "./ExportService",
    "saveAs"
], function (ExportService, saveAs) {

    return {
        name: "platform/exporters",
        definition: {
            extensions: {
                services: [
                    {
                        key: "exportService",
                        implementation: function () {
                            return new ExportService(saveAs.saveAs);
                        }
                    }
                ],
                licenses: [
                    {
                        "name": "CSV.js",
                        "version": "3.6.4",
                        "author": "Kash Nouroozi",
                        "description": "Encoder for CSV (comma separated values) export",
                        "website": "https://github.com/knrz/CSV.js",
                        "copyright": "Copyright (c) 2014 Kash Nouroozi",
                        "license": "license-mit",
                        "link": "https://github.com/knrz/CSV.js/blob/3.6.4/LICENSE"
                    },
                    {
                        "name": "FileSaver.js",
                        "version": "0.0.2",
                        "author": "Eli Grey",
                        "description": "File download initiator (for file exports)",
                        "website": "https://github.com/eligrey/FileSaver.js/",
                        "copyright": "Copyright © 2015 Eli Grey.",
                        "license": "license-mit",
                        "link": "https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md"
                    }
                ]
            }
        }
    };
});
