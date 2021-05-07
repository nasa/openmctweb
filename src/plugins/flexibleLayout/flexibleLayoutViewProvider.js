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
    './components/flexibleLayout.vue',
    'vue'
], function (
    FlexibleLayoutComponent,
    Vue
) {
    function FlexibleLayoutViewProvider(openmct) {
        return {
            key: 'flexible-layout',
            name: 'FlexibleLayout',
            cssClass: 'icon-layout-view',
            canView: function (domainObject) {
                return domainObject.type === 'flexible-layout';
            },
            canEdit: function (domainObject) {
                return domainObject.type === 'flexible-layout';
            },
            view: function (domainObject, objectPath) {
                let component;

                return {
                    show: function (element, isEditing) {
                        component = new Vue({
                            el: element,
                            components: {
                                FlexibleLayoutComponent: FlexibleLayoutComponent.default
                            },
                            provide: {
                                openmct,
                                objectPath,
                                layoutObject: domainObject
                            },
                            data() {
                                return {
                                    isEditing: isEditing
                                };
                            },
                            template: '<flexible-layout-component ref="flexibleLayout" :isEditing="isEditing"></flexible-layout-component>'
                        });
                    },
                    getSelectionContext: function () {
                        return {
                            item: domainObject,
                            addContainer: component.$refs.flexibleLayout.addContainer,
                            deleteContainer: component.$refs.flexibleLayout.deleteContainer,
                            deleteFrame: component.$refs.flexibleLayout.deleteFrame,
                            type: 'flexible-layout'
                        };
                    },
                    onEditModeChange: function (isEditing) {
                        component.isEditing = isEditing;
                    },
                    destroy: function (element) {
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

    return FlexibleLayoutViewProvider;
});
