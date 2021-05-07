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
import LADTableViewProvider from './LADTableViewProvider';
import LADTableSetViewProvider from './LADTableSetViewProvider';
import ladTableCompositionPolicy from './LADTableCompositionPolicy';

export default function plugin() {
    return function install(openmct) {

        openmct.objectViews.addProvider(new LADTableViewProvider(openmct));
        openmct.objectViews.addProvider(new LADTableSetViewProvider(openmct));

        openmct.types.addType('LadTable', {
            name: "LAD Table",
            creatable: true,
            description: "A Latest Available Data tabular view in which each row displays the values for one or more contained telemetry objects.",
            cssClass: 'icon-tabular-lad',
            initialize(domainObject) {
                domainObject.composition = [];
            }
        });

        openmct.types.addType('LadTableSet', {
            name: "LAD Table Set",
            creatable: true,
            description: "A Latest Available Data tabular view in which each row displays the values for one or more contained telemetry objects.",
            cssClass: 'icon-tabular-lad-set',
            initialize(domainObject) {
                domainObject.composition = [];
            }
        });

        openmct.composition.addPolicy(ladTableCompositionPolicy(openmct));
    };
}
