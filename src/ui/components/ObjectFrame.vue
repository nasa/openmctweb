/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
<template>
<div
    class="c-so-view"
    :class="[
        'c-so-view--' + domainObject.type,
        {
            'c-so-view--no-frame': !hasFrame,
            'has-complex-content': complexContent,
            'is-missing': domainObject.status === 'missing'
        }
    ]"
>
    <div
        class="c-so-view__header"
    >
        <div class="c-object-label"
             :class="{
                 classList,
                 'is-missing': domainObject.status === 'missing'
             }"
        >
            <div class="c-object-label__type-icon"
                 :class="cssClass"
            >
                <span class="is-missing__indicator"
                      title="This item is missing"
                ></span>
            </div>
            <div class="c-object-label__name">
                {{ domainObject && domainObject.name }}
            </div>
        </div>

        <div
            class="c-so-view__frame-controls"
            :class="{
                'c-so-view__frame-controls--no-frame': !hasFrame,
                'has-complex-content': complexContent
            }"
        >
            <NotebookMenuSwitcher v-if="notebookEnabled"
                                  :domain-object="domainObject"
                                  :object-path="objectPath"
                                  class="c-notebook-snapshot-menubutton"
            />
            <div class="c-so-view__frame-controls__btns">
                <button
                    v-for="(item, index) in statusBarItems"
                    :key="index"
                    class="c-icon-button"
                    :class="item.cssClass"
                    :title="item.name"
                    @click="item.callBack"
                >
                    <span class="c-icon-button__label">{{ item.name }}</span>
                </button>

                <button
                    class="c-icon-button icon-items-expand"
                    title="View Large"
                    @click="expand"
                >
                    <span class="c-icon-button__label">View Large</span>
                </button>

            </div>
            <button
                class="c-icon-button icon-3-dots c-so-view__frame-controls__more"
                title="View menu items"
                @click.prevent.stop="showMenuItems($event)"
            ></button>
        </div>
    </div>

    <div class="is-missing__indicator"
         title="This item is missing"
    ></div>
    <object-view
        ref="objectView"
        class="c-so-view__object-view"
        :object="domainObject"
        :show-edit-view="showEditView"
        :object-path="objectPath"
        :layout-font-size="layoutFontSize"
        :layout-font="layoutFont"
        @change-provider="setViewProvider"
    />
</div>
</template>

<script>
import ObjectView from './ObjectView.vue';
import PreviewHeader from '@/ui/preview/preview-header.vue';
import NotebookMenuSwitcher from '@/plugins/notebook/components/NotebookMenuSwitcher.vue';
import Vue from 'vue';

const SIMPLE_CONTENT_TYPES = [
    'clock',
    'timer',
    'summary-widget',
    'hyperlink',
    'conditionWidget'
];

export default {
    inject: ['openmct'],
    components: {
        ObjectView,
        NotebookMenuSwitcher
    },
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        objectPath: {
            type: Array,
            required: true
        },
        hasFrame: Boolean,
        showEditView: {
            type: Boolean,
            default: true
        },
        layoutFontSize: {
            type: String,
            default: ''
        },
        layoutFont: {
            type: String,
            default: ''
        }
    },
    data() {
        let objectType = this.openmct.types.get(this.domainObject.type);

        let cssClass = objectType && objectType.definition ? objectType.definition.cssClass : 'icon-object-unknown';

        let complexContent = !SIMPLE_CONTENT_TYPES.includes(this.domainObject.type);

        let viewProvider = {};

        let statusBarItems = {};

        return {
            cssClass,
            complexContent,
            notebookEnabled: this.openmct.types.get('notebook'),
            viewProvider,
            statusBarItems
        };
    },
    computed: {
        classList() {
            const classList = this.domainObject.classList;
            if (!classList || !classList.length) {
                return '';
            }

            return classList.join(' ');
        }
    },
    beforeDestroy() {
        if (this.actionCollection) {
            this.unlistenToActionCollection();
        }
    },
    methods: {
        expand() {
            let objectView = this.$refs.objectView;
            let parentElement = objectView.$el;
            let childElement = parentElement.children[0];

            this.openmct.overlays.overlay({
                element: this.getOverlayElement(childElement),
                size: 'large',
                onDestroy() {
                    parentElement.append(childElement);
                }
            });
        },
        getOverlayElement(childElement) {
            const fragment = new DocumentFragment();
            const header = this.getPreviewHeader();
            const wrapper = document.createElement('div');
            wrapper.classList.add('l-preview-window__object-view');
            wrapper.append(childElement);
            fragment.append(header);
            fragment.append(wrapper);

            return fragment;
        },
        getPreviewHeader() {
            const domainObject = this.objectPath[0];
            const preview = new Vue({
                components: {
                    PreviewHeader
                },
                provide: {
                    openmct: this.openmct,
                    objectPath: this.objectPath
                },
                data() {
                    return {
                        domainObject
                    };
                },
                template: '<PreviewHeader :domainObject="domainObject" :hideViewSwitcher="true" :showNotebookMenuSwitcher="true"></PreviewHeader>'
            });

            return preview.$mount().$el;
        },
        getSelectionContext() {
            return this.$refs.objectView.getSelectionContext();
        },
        setViewProvider(provider) {
            this.viewProvider = provider;
            this.initializeStatusBarItems();
        },
        initializeStatusBarItems() {
            if (this.actionCollection) {
                this.unlistenToActionCollection();
            }

            if (this.viewProvider) {
                this.actionCollection = this.openmct.actions.get(this.objectPath, this.viewProvider);
                this.actionCollection.on('update', this.updateActionItems);
                this.updateActionItems(this.actionCollection.applicableActions);
            } else {
                this.statusBarItems = [];
                this.menuActionItems = [];
            }
        },
        unlistenToActionCollection() {
            this.actionCollection.off('update', this.updateActionItems);
            this.actionCollection.destroy();
            delete this.actionCollection;
        },
        updateActionItems(actionItems) {
            this.statusBarItems = this.actionCollection.getStatusBarActions();
            this.menuActionItems = this.actionCollection.getVisibleActions();
        },
        showMenuItems(event) {
            let actions;

            if (this.menuActionItems.length) {
                actions = this.menuActionItems;
            } else {
                actions = this.openmct.actions.get(this.objectPath);
            }

            let sortedActions = this.openmct.actions._groupAndSortActions(actions);
            this.openmct.menus.showMenu(event.x, event.y, sortedActions);
        }
    }
};
</script>
