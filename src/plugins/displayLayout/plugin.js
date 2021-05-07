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

import Layout from './components/DisplayLayout.vue';
import Vue from 'vue';
import objectUtils from 'objectUtils';
import DisplayLayoutType from './DisplayLayoutType.js';
import DisplayLayoutToolbar from './DisplayLayoutToolbar.js';
import AlphaNumericFormatViewProvider from './AlphanumericFormatViewProvider.js';
import CopyToClipboardAction from './actions/CopyToClipboardAction';

export default function DisplayLayoutPlugin(options) {
    return function (openmct) {
        openmct.actions.register(new CopyToClipboardAction(openmct));

        openmct.objectViews.addProvider({
            key: 'layout.view',
            canView: function (domainObject) {
                return domainObject.type === 'layout';
            },
            canEdit: function (domainObject) {
                return domainObject.type === 'layout';
            },
            view: function (domainObject, objectPath) {
                let component;

                return {
                    show(container) {
                        component = new Vue({
                            el: container,
                            components: {
                                Layout
                            },
                            provide: {
                                openmct,
                                objectUtils,
                                options,
                                objectPath
                            },
                            data() {
                                return {
                                    domainObject: domainObject,
                                    isEditing: openmct.editor.isEditing()
                                };
                            },
                            template: '<layout ref="displayLayout" :domain-object="domainObject" :is-editing="isEditing"></layout>'
                        });
                    },
                    getSelectionContext() {
                        return {
                            item: domainObject,
                            supportsMultiSelect: true,
                            addElement: component && component.$refs.displayLayout.addElement,
                            removeItem: component && component.$refs.displayLayout.removeItem,
                            orderItem: component && component.$refs.displayLayout.orderItem,
                            duplicateItem: component && component.$refs.displayLayout.duplicateItem,
                            switchViewType: component && component.$refs.displayLayout.switchViewType,
                            mergeMultipleTelemetryViews: component && component.$refs.displayLayout.mergeMultipleTelemetryViews,
                            mergeMultipleOverlayPlots: component && component.$refs.displayLayout.mergeMultipleOverlayPlots,
                            toggleGrid: component && component.$refs.displayLayout.toggleGrid
                        };
                    },
                    onEditModeChange: function (isEditing) {
                        component.isEditing = isEditing;
                    },
                    destroy() {
                        component.$destroy();
                    }
                };
            },
            priority() {
                return 100;
            }
        });
        openmct.types.addType('layout', DisplayLayoutType());
        openmct.toolbars.addProvider(new DisplayLayoutToolbar(openmct, options));
        openmct.inspectorViews.addProvider(new AlphaNumericFormatViewProvider(openmct, options));
        openmct.composition.addPolicy((parent, child) => {
            if (parent.type === 'layout' && child.type === 'folder') {
                return false;
            } else {
                return true;
            }
        });
        DisplayLayoutPlugin._installed = true;
    };
}
