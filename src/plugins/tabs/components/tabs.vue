<template>
<div class="c-tabs-view">
    <div
        class="c-tabs-view__tabs-holder c-tabs"
        :class="{
            'is-dragging': isDragging && allowEditing,
            'is-mouse-over': allowDrop
        }"
    >
        <div
            class="c-drop-hint"
            @drop="onDrop"
            @dragenter="dragenter"
            @dragleave="dragleave"
        ></div>
        <div
            v-if="!tabsList.length > 0"
            class="c-tabs-view__empty-message"
        >
            Drag objects here to add them to this view.
        </div>
        <div
            v-for="(tab, index) in tabsList"
            :key="tab.keyString"
            class="c-tab c-tabs-view__tab js-tab"
            :class="{
                'is-current': isCurrent(tab)
            }"
            @click="showTab(tab, index)"
        >
            <div class="c-tabs-view__tab__label c-object-label"
                 :class="[tab.status ? `is-status--${tab.status}` : '']"
            >
                <div class="c-object-label__type-icon"
                     :class="tab.type.definition.cssClass"
                >
                    <span class="is-status__indicator"
                          :title="`This item is ${tab.status}`"
                    ></span>
                </div>
                <span class="c-button__label c-object-label__name">{{ tab.domainObject.name }}</span>
            </div>
            <button v-if="isEditing"
                    class="icon-x c-click-icon c-tabs-view__tab__close-btn"
                    @click="showRemoveDialog(index)"
            ></button>
        </div>
    </div>
    <div
        v-for="tab in tabsList"
        :key="tab.keyString"
        class="c-tabs-view__object-holder"
        :class="{'c-tabs-view__object-holder--hidden': !isCurrent(tab)}"
    >
        <object-view
            v-if="isTabLoaded(tab)"
            class="c-tabs-view__object"
            :default-object="tab.domainObject"
            :object-path="tab.objectPath"
        />
    </div>
</div>
</template>

<script>
import ObjectView from '../../../ui/components/ObjectView.vue';
import RemoveAction from '../../remove/RemoveAction.js';
import {
    getSearchParam,
    setSearchParam,
    deleteSearchParam
} from 'utils/openmctLocation';

const unknownObjectType = {
    definition: {
        cssClass: 'icon-object-unknown',
        name: 'Unknown Type'
    }
};

export default {
    components: {
        ObjectView
    },
    inject: ['openmct', 'domainObject', 'composition', 'objectPath'],
    props: {
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data: function () {
        let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

        return {
            internalDomainObject: this.domainObject,
            currentTab: {},
            currentTabIndex: undefined,
            tabsList: [],
            setCurrentTab: true,
            isDragging: false,
            allowDrop: false,
            searchTabKey: `tabs.pos.${keyString}`,
            loadedTabs: {}
        };
    },
    computed: {
        allowEditing() {
            return !this.internalDomainObject.locked && this.isEditing;
        }
    },
    mounted() {
        if (this.composition) {
            this.composition.on('add', this.addItem);
            this.composition.on('remove', this.removeItem);
            this.composition.on('reorder', this.onReorder);
            this.composition.load().then(() => {
                let currentTabIndexFromURL = getSearchParam(this.searchTabKey);
                let currentTabIndexFromDomainObject = this.internalDomainObject.currentTabIndex;

                if (currentTabIndexFromURL !== null) {
                    this.setCurrentTabByIndex(currentTabIndexFromURL);
                } else if (currentTabIndexFromDomainObject !== undefined) {
                    this.setCurrentTabByIndex(currentTabIndexFromDomainObject);
                    this.storeCurrentTabIndexInURL(currentTabIndexFromDomainObject);
                }
            });
        }

        this.unsubscribe = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);

        this.RemoveAction = new RemoveAction(this.openmct);
        document.addEventListener('dragstart', this.dragstart);
        document.addEventListener('dragend', this.dragend);
    },
    beforeDestroy() {
        this.persistCurrentTabIndex(this.currentTabIndex);
    },
    destroyed() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.onReorder);

        this.tabsList.forEach(tab => {
            tab.statusUnsubscribe();
        });

        this.unsubscribe();
        this.clearCurrentTabIndexFromURL();

        document.removeEventListener('dragstart', this.dragstart);
        document.removeEventListener('dragend', this.dragend);
    },
    methods: {
        addTabToLoaded(tab) {
            this.loadedTabs[tab.keyString] = true;
        },
        setCurrentTabByIndex(index) {
            if (this.tabsList[index]) {
                this.showTab(this.tabsList[index]);
            }
        },
        showTab(tab, index) {
            if (index !== undefined) {
                this.storeCurrentTabIndexInURL(index);
            }

            this.currentTab = tab;
            this.addTabToLoaded(tab);
        },
        showRemoveDialog(index) {
            if (!this.tabsList[index]) {
                return;
            }

            let activeTab = this.tabsList[index];
            let childDomainObject = activeTab.domainObject;

            let prompt = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: `This action will remove this tab from the Tabs Layout. Do you want to continue?`,
                buttons: [
                    {
                        label: 'Ok',
                        emphasis: 'true',
                        callback: () => {
                            this.composition.remove(childDomainObject);
                            prompt.dismiss();
                        }
                    },
                    {
                        label: 'Cancel',
                        callback: () => {
                            prompt.dismiss();
                        }
                    }
                ]
            });
        },
        addItem(domainObject) {
            let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
            let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            let status = this.openmct.status.get(domainObject.identifier);
            let statusUnsubscribe = this.openmct.status.observe(keyString, (updatedStatus) => {
                this.updateStatus(keyString, updatedStatus);
            });
            let objectPath = [domainObject].concat(this.objectPath.slice());
            let tabItem = {
                domainObject,
                status,
                statusUnsubscribe,
                objectPath,
                type,
                keyString
            };

            this.tabsList.push(tabItem);

            if (this.setCurrentTab) {
                this.showTab(tabItem);
                this.setCurrentTab = false;
            }
        },
        reset() {
            this.currentTab = {};
            this.setCurrentTab = true;
        },
        removeItem(identifier) {
            let keyStringToBeRemoved = this.openmct.objects.makeKeyString(identifier);

            let pos = this.tabsList.findIndex(tab => {
                return tab.keyString === keyStringToBeRemoved;
            });

            let tabToBeRemoved = this.tabsList[pos];

            tabToBeRemoved.statusUnsubscribe();

            this.tabsList.splice(pos, 1);

            this.loadedTabs[keyStringToBeRemoved] = undefined;
            delete this.loadedTabs[keyStringToBeRemoved];

            if (this.isCurrent(tabToBeRemoved)) {
                this.showTab(this.tabsList[this.tabsList.length - 1], this.tabsList.length - 1);
            }

            if (!this.tabsList.length) {
                this.reset();
            }
        },
        onReorder(reorderPlan) {
            let oldTabs = this.tabsList.slice();

            reorderPlan.forEach(reorderEvent => {
                this.$set(this.tabsList, reorderEvent.newIndex, oldTabs[reorderEvent.oldIndex]);
            });
        },
        onDrop(e) {
            this.setCurrentTab = true;
            this.storeCurrentTabIndexInURL(this.tabsList.length);
        },
        dragstart(e) {
            if (e.dataTransfer.types.includes('openmct/domain-object-path')) {
                this.isDragging = true;
            }
        },
        dragend(e) {
            this.isDragging = false;
            this.allowDrop = false;
        },
        dragenter() {
            this.allowDrop = true;
        },
        dragleave() {
            this.allowDrop = false;
        },
        isCurrent(tab) {
            return this.currentTab.keyString === tab.keyString;
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        },
        persistCurrentTabIndex(index) {
            this.openmct.objects.mutate(this.internalDomainObject, 'currentTabIndex', index);
        },
        storeCurrentTabIndexInURL(index) {
            let currentTabIndexInURL = getSearchParam(this.searchTabKey);

            if (index !== currentTabIndexInURL) {
                setSearchParam(this.searchTabKey, index);
                this.currentTabIndex = index;
            }
        },
        clearCurrentTabIndexFromURL() {
            deleteSearchParam(this.searchTabKey);
        },
        updateStatus(keyString, status) {
            let tabPos = this.tabsList.findIndex((tab) => {
                return tab.keyString === keyString;
            });
            let tab = this.tabsList[tabPos];

            this.$set(tab, 'status', status);
        },
        isTabLoaded(tab) {
            if (this.internalDomainObject.keep_alive) {
                return true;
            } else {
                return this.loadedTabs[tab.keyString];
            }
        }
    }
};
</script>
