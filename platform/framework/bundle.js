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

define([], function () {

    return {
        name: "platform/framework",
        definition: {
            "name": "Open MCT Framework Component",
            "description": "Framework layer for Open MCT; interprets bundle definitions and serves as an intermediary between Require and Angular",
            "libraries": "lib",
            "configuration": {
                "paths": {
                    "angular": "angular.min"
                },
                "shim": {
                    "angular": {
                        "exports": "angular"
                    }
                }
            },
            "extensions": {
                "licenses": [
                    {
                        "name": "Blanket.js",
                        "version": "1.1.5",
                        "description": "Code coverage measurement and reporting",
                        "author": "Alex Seville",
                        "website": "http://blanketjs.org/",
                        "copyright": "Copyright (c) 2013 Alex Seville",
                        "license": "license-mit",
                        "link": "http://opensource.org/licenses/MIT"
                    },
                    {
                        "name": "Jasmine",
                        "version": "1.3.1",
                        "description": "Unit testing",
                        "author": "Pivotal Labs",
                        "website": "http://jasmine.github.io/",
                        "copyright": "Copyright (c) 2008-2011 Pivotal Labs",
                        "license": "license-mit",
                        "link": "http://opensource.org/licenses/MIT"
                    },
                    {
                        "name": "RequireJS",
                        "version": "2.1.22",
                        "description": "Script loader",
                        "author": "The Dojo Foundation",
                        "website": "http://requirejs.org/",
                        "copyright": "Copyright (c) 2010-2015, The Dojo Foundation",
                        "license": "license-mit",
                        "link": "https://github.com/jrburke/requirejs/blob/master/LICENSE"
                    },
                    {
                        "name": "AngularJS",
                        "version": "1.4.4",
                        "description": "Client-side web application framework",
                        "author": "Google",
                        "website": "http://angularjs.org/",
                        "copyright": "Copyright (c) 2010-2015 Google, Inc. http://angularjs.org",
                        "license": "license-mit",
                        "link": "https://github.com/angular/angular.js/blob/v1.4.4/LICENSE"
                    },
                    {
                        "name": "Angular-Route",
                        "version": "1.4.4",
                        "description": "Client-side view routing",
                        "author": "Google",
                        "website": "http://angularjs.org/",
                        "copyright": "Copyright (c) 2010-2015 Google, Inc. http://angularjs.org",
                        "license": "license-mit",
                        "link": "https://github.com/angular/angular.js/blob/v1.4.4/LICENSE"
                    },
                    {
                        "name": "ES6-Promise",
                        "version": "3.0.2",
                        "description": "Promise polyfill for pre-ECMAScript 6 browsers",
                        "author": "Yehuda Katz, Tom Dale, Stefan Penner and contributors",
                        "website": "https://github.com/jakearchibald/es6-promise",
                        "copyright": "Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors",
                        "license": "license-mit",
                        "link": "https://github.com/jakearchibald/es6-promise/blob/master/LICENSE"
                    }
                ]
            }
        }
    };
});
