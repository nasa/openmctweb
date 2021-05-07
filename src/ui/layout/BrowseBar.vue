<template>
<div class="l-browse-bar">
    <div class="l-browse-bar__start">
        <button
            v-if="hasParent"
            class="l-browse-bar__nav-to-parent-button c-icon-button c-icon-button--major icon-arrow-nav-to-parent"
            title="Navigate up to parent"
            @click="goToParent"
        ></button>
        <div
            class="l-browse-bar__object-name--w c-object-label"
            :class="[statusClass]"
        >
            <div class="c-object-label__type-icon"
                 :class="type.cssClass"
            >
                <span class="is-status__indicator"
                      :title="`This item is ${status}`"
                ></span>
            </div>
            <span
                class="l-browse-bar__object-name c-object-label__name"
                :class="{ 'c-input-inline' : type.creatable}"
                :contenteditable="type.creatable"
                @blur="updateName"
                @keydown.enter.prevent
                @keyup.enter.prevent="updateNameOnEnterKeyPress"
            >
                {{ domainObject.name }}
            </span>
        </div>
    </div>

    <div class="l-browse-bar__end">
        <view-switcher
            v-if="!isEditing"
            :current-view="currentView"
            :views="views"
        />
        <!-- Action buttons -->
        <NotebookMenuSwitcher v-if="notebookEnabled"
                              :domain-object="domainObject"
                              :object-path="openmct.router.path"
                              class="c-notebook-snapshot-menubutton"
        />
        <div class="l-browse-bar__actions">
            <button
                v-for="(item, index) in statusBarItems"
                :key="index"
                class="c-button"
                :class="item.cssClass"
                @click="item.callBack"
            >
            </button>

            <button
                v-if="isViewEditable & !isEditing"
                :title="lockedOrUnlockedTitle"
                :class="{
                    'c-button icon-lock': domainObject.locked,
                    'c-icon-button icon-unlocked': !domainObject.locked
                }"
                @click="toggleLock(!domainObject.locked)"
            ></button>

            <button
                v-if="isViewEditable && !isEditing && !domainObject.locked"
                class="l-browse-bar__actions__edit c-button c-button--major icon-pencil"
                title="Edit"
                @click="edit()"
            ></button>

            <div
                v-if="isEditing"
                class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
            >
                <button
                    class="c-button--menu c-button--major icon-save"
                    title="Save"
                    @click.stop="toggleSaveMenu"
                ></button>
                <div
                    v-show="showSaveMenu"
                    class="c-menu"
                >
                    <ul>
                        <li
                            class="icon-save"
                            title="Save and Finish Editing"
                            @click="saveAndFinishEditing"
                        >
                            Save and Finish Editing
                        </li>
                        <li
                            class="icon-save"
                            title="Save and Continue Editing"
                            @click="saveAndContinueEditing"
                        >
                            Save and Continue Editing
                        </li>
                    </ul>
                </div>
            </div>

            <button
                v-if="isEditing"
                class="l-browse-bar__actions c-button icon-x"
                title="Cancel Editing"
                @click="promptUserandCancelEditing()"
            ></button>
            <button
                class="l-browse-bar__actions c-icon-button icon-3-dots"
                title="More options"
                @click.prevent.stop="showMenuItems($event)"
            ></button>
        </div>
    </div>
</div>
</template>

<script>
import ViewSwitcher from './ViewSwitcher.vue';
import NotebookMenuSwitcher from '@/plugins/notebook/components/NotebookMenuSwitcher.vue';

const PLACEHOLDER_OBJECT = {};

export default {
    components: {
        NotebookMenuSwitcher,
        ViewSwitcher
    },
    inject: ['openmct'],
    props: {
        actionCollection: {
            type: Object,
            default: () => {
                return {};
            }
        }
    },
    data: function () {
        return {
            notebookTypes: [],
            showViewMenu: false,
            showSaveMenu: false,
            domainObject: PLACEHOLDER_OBJECT,
            viewKey: undefined,
            isEditing: this.openmct.editor.isEditing(),
            notebookEnabled: this.openmct.types.get('notebook'),
            statusBarItems: [],
            status: ''
        };
    },
    computed: {
        statusClass() {
            return (this.status) ? `is-status--${this.status}` : '';
        },
        currentView() {
            return this.views.filter(v => v.key === this.viewKey)[0] || {};
        },
        views() {
            if (this.domainObject && (this.openmct.router.started !== true)) {
                return [];
            }

            return this
                .openmct
                .objectViews
                .get(this.domainObject, this.openmct.router.path)
                .map((p) => {
                    return {
                        key: p.key,
                        cssClass: p.cssClass,
                        name: p.name,
                        callBack: () => {
                            return this.setView({key: p.key});
                        }
                    };
                });
        },
        hasParent() {
            return this.domainObject !== PLACEHOLDER_OBJECT
                    && this.parentUrl !== '#/browse';
        },
        parentUrl() {
            let objectKeyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let hash = window.location.hash;

            return hash.slice(0, hash.lastIndexOf('/' + objectKeyString));
        },
        type() {
            let objectType = this.openmct.types.get(this.domainObject.type);
            if (!objectType) {
                return {};
            }

            return objectType.definition;
        },
        isViewEditable() {
            let currentViewKey = this.currentView.key;
            if (currentViewKey !== undefined) {
                let currentViewProvider = this.openmct.objectViews.getByProviderKey(currentViewKey);

                return currentViewProvider.canEdit && currentViewProvider.canEdit(this.domainObject, this.openmct.router.path);
            }

            return false;
        },
        lockedOrUnlockedTitle() {
            if (this.domainObject.locked) {
                return 'Locked for editing - click to unlock.';
            } else {
                return 'Unlocked for editing - click to lock.';
            }
        }
    },
    watch: {
        domainObject() {
            if (this.removeStatusListener) {
                this.removeStatusListener();
            }

            this.status = this.openmct.status.get(this.domainObject.identifier, this.setStatus);
            this.removeStatusListener = this.openmct.status.observe(this.domainObject.identifier, this.setStatus);
        },
        actionCollection(actionCollection) {
            if (this.actionCollection) {
                this.unlistenToActionCollection();
            }

            this.actionCollection = actionCollection;
            this.actionCollection.on('update', this.updateActionItems);
            this.updateActionItems(this.actionCollection.getActionsObject());
        }
    },
    mounted: function () {
        document.addEventListener('click', this.closeViewAndSaveMenu);
        window.addEventListener('beforeunload', this.promptUserbeforeNavigatingAway);

        this.openmct.editor.on('isEditing', (isEditing) => {
            this.isEditing = isEditing;
        });
    },
    beforeDestroy: function () {
        if (this.mutationObserver) {
            this.mutationObserver();
        }

        if (this.actionCollection) {
            this.unlistenToActionCollection();
        }

        if (this.removeStatusListener) {
            this.removeStatusListener();
        }

        document.removeEventListener('click', this.closeViewAndSaveMenu);
        window.removeEventListener('click', this.promptUserbeforeNavigatingAway);
    },
    methods: {
        toggleSaveMenu() {
            this.showSaveMenu = !this.showSaveMenu;
        },
        closeViewAndSaveMenu() {
            this.showViewMenu = false;
            this.showSaveMenu = false;
        },
        updateName(event) {
            if (event.target.innerText !== this.domainObject.name && event.target.innerText.match(/\S/)) {
                this.openmct.objects.mutate(this.domainObject, 'name', event.target.innerText);
            }
        },
        updateNameOnEnterKeyPress(event) {
            event.target.blur();
        },
        setView(view) {
            this.viewKey = view.key;
            this.openmct.router.updateParams({
                view: this.viewKey
            });
        },
        edit() {
            this.openmct.editor.edit();
        },
        promptUserandCancelEditing() {
            let dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: 'Any unsaved changes will be lost. Are you sure you want to continue?',
                buttons: [
                    {
                        label: 'Ok',
                        emphasis: true,
                        callback: () => {
                            this.openmct.editor.cancel().then(() => {
                                //refresh object view
                                this.openmct.layout.$refs.browseObject.show(this.domainObject, this.viewKey, true);
                            });
                            dialog.dismiss();
                        }
                    },
                    {
                        label: 'Cancel',
                        callback: () => {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        },
        promptUserbeforeNavigatingAway(event) {
            if (this.openmct.editor.isEditing()) {
                event.preventDefault();
                event.returnValue = '';
            }
        },
        saveAndFinishEditing() {
            let dialog = this.openmct.overlays.progressDialog({
                progressPerc: 'unknown',
                message: 'Do not navigate away from this page or close this browser tab while this message is displayed.',
                iconClass: 'info',
                title: 'Saving'
            });

            return this.openmct.editor.save().then(() => {
                dialog.dismiss();
                this.openmct.notifications.info('Save successful');
            }).catch((error) => {
                dialog.dismiss();
                this.openmct.notifications.error('Error saving objects');
                console.error(error);
            });
        },
        saveAndContinueEditing() {
            this.saveAndFinishEditing().then(() => {
                this.openmct.editor.edit();
            });
        },
        goToParent() {
            window.location.hash = this.parentUrl;
        },
        updateActionItems(actionItems) {
            this.statusBarItems = this.actionCollection.getStatusBarActions();
            this.menuActionItems = this.actionCollection.getVisibleActions();
        },
        showMenuItems(event) {
            let sortedActions = this.openmct.actions._groupAndSortActions(this.menuActionItems);
            this.openmct.menus.showMenu(event.x, event.y, sortedActions);
        },
        unlistenToActionCollection() {
            this.actionCollection.off('update', this.updateActionItems);
            delete this.actionCollection;
        },
        toggleLock(flag) {
            this.openmct.objects.mutate(this.domainObject, 'locked', flag);
        },
        setStatus(status) {
            this.status = status;
        }
    }
};
</script>
