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

import ConditionWidgetViewProvider from './ConditionWidgetViewProvider.js';

export default function plugin() {
    return function install(openmct) {
        openmct.objectViews.addProvider(new ConditionWidgetViewProvider(openmct));

        openmct.types.addType('conditionWidget', {
            name: "Condition Widget",
            description: "A button that can be used on its own, or dynamically styled with a Condition Set.",
            creatable: true,
            cssClass: 'icon-condition-widget',
            initialize(domainObject) {
                domainObject.label = 'Condition Widget';
            },
            form: [
                {
                    "key": "label",
                    "name": "Label",
                    "control": "textfield",
                    property: [
                        "label"
                    ],
                    "required": true,
                    "cssClass": "l-input"
                },
                {
                    "key": "url",
                    "name": "URL",
                    "control": "textfield",
                    "required": false,
                    "cssClass": "l-input-lg"
                }
            ]
        });
    };
}
