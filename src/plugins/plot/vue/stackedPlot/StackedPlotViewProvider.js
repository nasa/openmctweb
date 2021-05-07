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

import StackedPlot from './StackedPlot.vue';
import Vue from 'vue';

export default function StackedPlotViewProvider(openmct) {
    function isCompactView(objectPath) {
        return objectPath.find(object => object.type === 'time-strip');
    }

    return {
        key: 'plot-stacked',
        name: 'Stacked Plot',
        cssClass: 'icon-telemetry',
        canView(domainObject, objectPath) {
            return isCompactView(objectPath) && domainObject.type === 'telemetry.plot.stacked';
        },

        canEdit(domainObject, objectPath) {
            return isCompactView(objectPath) && domainObject.type === 'telemetry.plot.stacked';
        },

        view: function (domainObject, objectPath) {
            let component;

            return {
                show: function (element) {
                    let isCompact = isCompactView(objectPath);

                    component = new Vue({
                        el: element,
                        components: {
                            StackedPlot
                        },
                        provide: {
                            openmct,
                            domainObject,
                            composition: openmct.composition.get(domainObject)
                        },
                        data() {
                            return {
                                options: {
                                    compact: isCompact
                                }
                            };
                        },
                        template: '<stacked-plot :options="options"></stacked-plot>'
                    });
                },
                destroy: function () {
                    component.$destroy();
                    component = undefined;
                }
            };
        }
    };
}
