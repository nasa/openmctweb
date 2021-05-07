<template>
<div class="c-inspector">
    <object-name />
    <div v-if="showStyles"
         class="c-inspector__tabs c-tabs"
    >
        <div v-for="tabbedView in tabbedViews"
             :key="tabbedView.key"
             class="c-inspector__tab c-tab"
             :class="{'is-current': isCurrent(tabbedView)}"
             @click="updateCurrentTab(tabbedView)"
        >
            {{ tabbedView.name }}
        </div>

    </div>
    <div class="c-inspector__content">
        <multipane v-show="currentTabbedView.key === '__properties'"
                   type="vertical"
        >
            <pane class="c-inspector__properties">
                <properties />
                <location />
                <inspector-views />
            </pane>
            <pane
                v-if="isEditing && hasComposition"
                class="c-inspector__elements"
                handle="before"
                label="Elements"
            >
                <elements-pool />
            </pane>
        </multipane>
        <multipane
            v-show="currentTabbedView.key === '__styles'"
            type="vertical"
        >
            <pane class="c-inspector__styles">
                <StylesInspectorView />
            </pane>
            <pane
                v-if="isEditing"
                class="c-inspector__saved-styles"
                handle="before"
                label="Saved Styles"
            >
                <SavedStylesInspectorView :is-editing="isEditing" />
            </pane>
        </multipane>
    </div>
</div>
</template>

<script>
import multipane from '../layout/multipane.vue';
import pane from '../layout/pane.vue';
import ElementsPool from './ElementsPool.vue';
import Location from './Location.vue';
import Properties from './Properties.vue';
import ObjectName from './ObjectName.vue';
import InspectorViews from './InspectorViews.vue';
import _ from "lodash";
import stylesManager from '@/ui/inspector/styles/StylesManager';
import StylesInspectorView from '@/ui/inspector/styles/StylesInspectorView.vue';
import SavedStylesInspectorView from '@/ui/inspector/styles/SavedStylesInspectorView.vue';

export default {
    components: {
        StylesInspectorView,
        SavedStylesInspectorView,
        multipane,
        pane,
        ElementsPool,
        Properties,
        ObjectName,
        Location,
        InspectorViews
    },
    provide: {
        stylesManager: stylesManager
    },
    inject: ['openmct'],
    props: {
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            hasComposition: false,
            showStyles: false,
            tabbedViews: [{
                key: '__properties',
                name: 'Properties'
            }, {
                key: '__styles',
                name: 'Styles'
            }],
            currentTabbedView: {}
        };
    },
    mounted() {
        this.excludeObjectTypes = ['folder', 'webPage', 'conditionSet', 'summary-widget', 'hyperlink'];
        this.openmct.selection.on('change', this.updateInspectorViews);
    },
    destroyed() {
        this.openmct.selection.off('change', this.updateInspectorViews);
    },
    methods: {
        updateInspectorViews(selection) {
            this.refreshComposition(selection);
            if (this.openmct.types.get('conditionSet')) {
                this.refreshTabs(selection);
            }
        },
        refreshComposition(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                let parentObject = selection[0][0].context.item;

                this.hasComposition = Boolean(parentObject && this.openmct.composition.get(parentObject));
            }
        },
        refreshTabs(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                //layout items are not domain objects but should allow conditional styles
                this.showStyles = selection[0][0].context.layoutItem;
                let object = selection[0][0].context.item;
                if (object) {
                    let type = this.openmct.types.get(object.type);
                    this.showStyles = this.isLayoutObject(selection[0], object.type) || this.isCreatableObject(object, type);
                }

                if (!this.currentTabbedView.key || (!this.showStyles && this.currentTabbedView.key === this.tabbedViews[1].key)) {
                    this.updateCurrentTab(this.tabbedViews[0]);
                }
            }
        },
        isLayoutObject(selection, objectType) {
            //we allow conditionSets to be styled if they're part of a layout
            return selection.length > 1
                && ((objectType === 'conditionSet') || (this.excludeObjectTypes.indexOf(objectType) < 0));
        },
        isCreatableObject(object, type) {
            return (this.excludeObjectTypes.indexOf(object.type) < 0) && type.definition.creatable;
        },
        updateCurrentTab(view) {
            this.currentTabbedView = view;
        },
        isCurrent(view) {
            return _.isEqual(this.currentTabbedView, view);
        }
    }
};
</script>
