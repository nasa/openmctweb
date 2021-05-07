<template>
<div class="c-preview-header l-browse-bar">
    <div class="l-browse-bar__start">
        <div
            class="l-browse-bar__object-name--w c-object-label"
        >
            <div class="c-object-label__type-icon"
                 :class="type.definition.cssClass"
            ></div>
            <span class="l-browse-bar__object-name c-object-label__name">
                {{ domainObject.name }}
            </span>
        </div>
    </div>
    <div class="l-browse-bar__end">
        <view-switcher
            :v-if="!hideViewSwitcher"
            :views="views"
            :current-view="currentView"
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
                class="l-browse-bar__actions c-icon-button icon-3-dots"
                title="More options"
                @click.prevent.stop="showMenuItems($event)"
            ></button>
        </div>
    </div>
</div>
</template>

<script>
import ViewSwitcher from '../../ui/layout/ViewSwitcher.vue';
const HIDDEN_ACTIONS = [
    'remove',
    'move',
    'preview'
];

export default {
    components: {
        ViewSwitcher
    },
    inject: [
        'openmct'
    ],
    props: {
        currentView: {
            type: Object,
            default: () => {
                return {};
            }
        },
        domainObject: {
            type: Object,
            default: () => {
                return {};
            }
        },
        hideViewSwitcher: {
            type: Boolean,
            default: () => {
                return false;
            }
        },
        views: {
            type: Array,
            default: () => {
                return [];
            }
        },
        actionCollection: {
            type: Object,
            default: () => {
                return undefined;
            }
        }
    },
    data() {
        return {
            type: this.openmct.types.get(this.domainObject.type),
            statusBarItems: [],
            menuActionItems: []
        };
    },
    watch: {
        actionCollection(actionCollection) {
            if (this.actionCollection) {
                this.unlistenToActionCollection();
            }

            this.actionCollection.on('update', this.updateActionItems);
            this.updateActionItems(this.actionCollection.getActionsObject());
        }
    },
    mounted() {
        if (this.actionCollection) {
            this.actionCollection.on('update', this.updateActionItems);
            this.updateActionItems(this.actionCollection.getActionsObject());
        }
    },
    methods: {
        setView(view) {
            this.$emit('setView', view);
        },
        unlistenToActionCollection() {
            this.actionCollection.off('update', this.updateActionItems);
            delete this.actionCollection;
        },
        updateActionItems() {
            this.actionCollection.hide(HIDDEN_ACTIONS);
            this.statusBarItems = this.actionCollection.getStatusBarActions();
            this.menuActionItems = this.actionCollection.getVisibleActions();
        },
        showMenuItems(event) {
            let sortedActions = this.openmct.actions._groupAndSortActions(this.menuActionItems);
            this.openmct.menus.showMenu(event.x, event.y, sortedActions);
        }
    }
};
</script>
