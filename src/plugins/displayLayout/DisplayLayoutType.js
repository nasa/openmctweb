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

define(function () {
    function DisplayLayoutType() {
        return {
            name: "Display Layout",
            creatable: true,
            description: 'Assemble other objects and components together into a reusable screen layout. Simply drag in the objects you want, position and size them. Save your design and view or edit it at any time.',
            cssClass: 'icon-layout',
            initialize(domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {
                    items: [],
                    layoutGrid: [10, 10]
                };
            },
            form: [
                {
                    name: "Horizontal grid (px)",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    property: [
                        "configuration",
                        "layoutGrid",
                        0
                    ],
                    required: true
                },
                {
                    name: "Vertical grid (px)",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    property: [
                        "configuration",
                        "layoutGrid",
                        1
                    ],
                    required: true
                },
                {
                    name: "Horizontal size (px)",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    property: [
                        "configuration",
                        "layoutDimensions",
                        0
                    ],
                    required: false
                },
                {
                    name: "Vertical size (px)",
                    control: "numberfield",
                    cssClass: "l-input-sm l-numeric",
                    property: [
                        "configuration",
                        "layoutDimensions",
                        1
                    ],
                    required: false
                }
            ]
        };
    }

    return DisplayLayoutType;
});
