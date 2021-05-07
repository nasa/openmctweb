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
    './components/AlphanumericFormatView.vue',
    'vue'
], function (AlphanumericFormatView, Vue) {

    function AlphanumericFormatViewProvider(openmct, options) {
        function isTelemetryObject(selectionPath) {
            let selectedObject = selectionPath[0].context.item;
            let parentObject = selectionPath[1].context.item;
            let selectedLayoutItem = selectionPath[0].context.layoutItem;

            return parentObject
                && parentObject.type === 'layout'
                && selectedObject
                && selectedLayoutItem
                && selectedLayoutItem.type === 'telemetry-view'
                && openmct.telemetry.isTelemetryObject(selectedObject)
                && !options.showAsView.includes(selectedObject.type);
        }

        return {
            key: 'alphanumeric-format',
            name: 'Alphanumeric Format',
            canView: function (selection) {
                if (selection.length === 0 || selection[0].length === 1) {
                    return false;
                }

                return selection.every(isTelemetryObject);
            },
            view: function (domainObject, objectPath) {
                let component;

                return {
                    show: function (element) {
                        component = new Vue({
                            el: element,
                            components: {
                                AlphanumericFormatView: AlphanumericFormatView.default
                            },
                            provide: {
                                openmct,
                                objectPath
                            },
                            template: '<alphanumeric-format-view ref="alphanumericFormatView"></alphanumeric-format-view>'
                        });
                    },
                    getViewContext() {
                        if (component) {
                            return component.$refs.alphanumericFormatView.getViewContext();
                        } else {
                            return {};
                        }
                    },
                    destroy: function () {
                        component.$destroy();
                        component = undefined;
                    }
                };
            },
            priority: function () {
                return 1;
            }
        };
    }

    return AlphanumericFormatViewProvider;
});
