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
    "./res/templates/about-dialog.html",
    "./src/LogoController",
    "./src/AboutController",
    "./src/LicenseController",
    "./res/templates/app-logo.html",
    "./res/templates/about-logo.html",
    "./res/templates/overlay-about.html",
    "./res/templates/license-apache.html",
    "./res/templates/license-mit.html",
    "./res/templates/licenses.html",
    "./res/templates/licenses-export-md.html"
], function (
    aboutDialogTemplate,
    LogoController,
    AboutController,
    LicenseController,
    appLogoTemplate,
    aboutLogoTemplate,
    overlayAboutTemplate,
    licenseApacheTemplate,
    licenseMitTemplate,
    licensesTemplate,
    licensesExportMdTemplate
) {

    return {
        name: "platform/commonUI/about",
        definition: {
            "name": "About Open MCT",
            "extensions": {
                "templates": [
                    {
                        "key": "app-logo",
                        "priority": "optional",
                        "template": appLogoTemplate
                    },
                    {
                        "key": "about-logo",
                        "priority": "preferred",
                        "template": aboutLogoTemplate
                    },
                    {
                        "key": "about-dialog",
                        "template": aboutDialogTemplate
                    },
                    {
                        "key": "overlay-about",
                        "template": overlayAboutTemplate
                    },
                    {
                        "key": "license-apache",
                        "template": licenseApacheTemplate
                    },
                    {
                        "key": "license-mit",
                        "template": licenseMitTemplate
                    }
                ],
                "controllers": [
                    {
                        "key": "LogoController",
                        "depends": [
                            "overlayService"
                        ],
                        "implementation": LogoController
                    },
                    {
                        "key": "AboutController",
                        "depends": [
                            "versions[]",
                            "$window"
                        ],
                        "implementation": AboutController
                    },
                    {
                        "key": "LicenseController",
                        "depends": [
                            "licenses[]"
                        ],
                        "implementation": LicenseController
                    }
                ],
                "licenses": [
                    {
                        "name": "Json.NET",
                        "version": "6.0.8",
                        "author": "Newtonsoft",
                        "description": "JSON serialization/deserialization",
                        "website": "http://www.newtonsoft.com/json",
                        "copyright": "Copyright (c) 2007 James Newton-King",
                        "license": "license-mit",
                        "link": "https://github.com/JamesNK/Newtonsoft.Json/blob/master/LICENSE.md"
                    },
                    {
                        "name": "Nancy",
                        "version": "0.23.2",
                        "author": "Andreas Håkansson, Steven Robbins and contributors",
                        "description": "Embedded web server",
                        "website": "http://nancyfx.org/",
                        "copyright": "Copyright © 2010 Andreas Håkansson, Steven Robbins and contributors",
                        "license": "license-mit",
                        "link": "http://www.opensource.org/licenses/mit-license.php"
                    },
                    {
                        "name": "Nancy.Hosting.Self",
                        "version": "0.23.2",
                        "author": "Andreas Håkansson, Steven Robbins and contributors",
                        "description": "Embedded web server",
                        "website": "http://nancyfx.org/",
                        "copyright": "Copyright © 2010 Andreas Håkansson, Steven Robbins and contributors",
                        "license": "license-mit",
                        "link": "http://www.opensource.org/licenses/mit-license.php"
                    },
                    {
                        "name": "SuperSocket",
                        "version": "0.9.0.2",
                        "author": " Kerry Jiang",
                        "description": "Supports SuperWebSocket",
                        "website": "https://supersocket.codeplex.com/",
                        "copyright": "Copyright 2010-2014 Kerry Jiang (kerry-jiang@hotmail.com)",
                        "license": "license-apache",
                        "link": "https://supersocket.codeplex.com/license"
                    },
                    {
                        "name": "SuperWebSocket",
                        "version": "0.9.0.2",
                        "author": " Kerry Jiang",
                        "description": "WebSocket implementation for client-server communication",
                        "website": "https://superwebsocket.codeplex.com/",
                        "copyright": "Copyright 2010-2014 Kerry Jiang (kerry-jiang@hotmail.com)",
                        "license": "license-apache",
                        "link": "https://superwebsocket.codeplex.com/license"
                    },
                    {
                        "name": "log4net",
                        "version": "2.0.3",
                        "author": "Apache Software Foundation",
                        "description": "Logging",
                        "website": "http://logging.apache.org/log4net/",
                        "copyright": "Copyright © 2004-2015 Apache Software Foundation.",
                        "license": "license-apache",
                        "link": "http://logging.apache.org/log4net/license.html"
                    }
                ],
                "routes": [
                    {
                        "when": "/licenses",
                        "template": licensesTemplate
                    },
                    {
                        "when": "/licenses-md",
                        "template": licensesExportMdTemplate
                    }
                ]
            }
        }
    };
});
