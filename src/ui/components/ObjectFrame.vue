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
<template>
<div
    class="c-so-view"
    :class="[
        statusClass,
        'c-so-view--' + domainObject.type,
        {
            'c-so-view--no-frame': !hasFrame,
            'has-complex-content': complexContent
        }
    ]"
>
    <div
        class="c-so-view__header"
    >
        <div class="c-object-label"
             :class="[ statusClass ]"
        >
            <div class="c-object-label__type-icon"
                 :class="cssClass"
            >
                <span class="is-status__indicator"
                      :title="`This item is ${status}`"
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

    <object-view
        ref="objectView"
        class="c-so-view__object-view"
        :show-edit-view="showEditView"
        :object-path="objectPath"
        :layout-font-size="layoutFontSize"
        :layout-font="layoutFont"
        @change-action-collection="setActionCollection"
    />
</div>
</template>

<script>
import ObjectView from './ObjectView.vue';
import PreviewHeader from '@/ui/preview/preview-header.vue';
import Vue from 'vue';

const SIMPLE_CONTENT_TYPES = [
    'clock',
    'timer',
    'summary-widget',
    'hyperlink',
    'conditionWidget'
];

export default {
    components: {
        ObjectView
    },
    inject: ['openmct'],
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

        return {
            cssClass,
            complexContent,
            statusBarItems: [],
            status: ''
        };
    },
    computed: {
        statusClass() {
            return (this.status) ? `is-status--${this.status}` : '';
        }
    },
    mounted() {
        this.status = this.openmct.status.get(this.domainObject.identifier);
        this.removeStatusListener = this.openmct.status.observe(this.domainObject.identifier, this.setStatus);
        this.$refs.objectView.show(this.domainObject, undefined, false, this.objectPath);
    },
    beforeDestroy() {
        this.removeStatusListener();

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
            const actionCollection = this.actionCollection;
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
                        domainObject,
                        actionCollection
                    };
                },
                template: '<PreviewHeader :actionCollection="actionCollection" :domainObject="domainObject" :hideViewSwitcher="true" :showNotebookMenuSwitcher="true"></PreviewHeader>'
            });

            return preview.$mount().$el;
        },
        getSelectionContext() {
            return this.$refs.objectView.getSelectionContext();
        },
        setActionCollection(actionCollection) {
            if (this.actionCollection) {
                this.unlistenToActionCollection();
            }

            this.actionCollection = actionCollection;
            this.actionCollection.on('update', this.updateActionItems);
            this.updateActionItems(this.actionCollection.applicableActions);
        },
        unlistenToActionCollection() {
            this.actionCollection.off('update', this.updateActionItems);
            delete this.actionCollection;
        },
        updateActionItems(actionItems) {
            this.statusBarItems = this.actionCollection.getStatusBarActions();
            this.menuActionItems = this.actionCollection.getVisibleActions();
        },
        showMenuItems(event) {
            let sortedActions = this.openmct.actions._groupAndSortActions(this.menuActionItems);
            this.openmct.menus.showMenu(event.x, event.y, sortedActions);
        },
        setStatus(status) {
            this.status = status;
        }
    }
};
</script>
