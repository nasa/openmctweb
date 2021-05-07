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
<div class="c-inspector__styles c-inspect-styles">
    <div v-if="isStaticAndConditionalStyles"
         class="c-inspect-styles__mixed-static-and-conditional u-alert u-alert--block u-alert--with-icon"
    >
        Your selection includes one or more items that use Conditional Styling. Applying a static style below will replace any Conditional Styling with the new choice.
    </div>
    <template v-if="!conditionSetDomainObject">
        <div class="c-inspect-styles__header">
            Object Style
        </div>
        <FontStyleEditor
            v-if="canStyleFont"
            :font-style="consolidatedFontStyle"
            @set-font-property="setFontProperty"
        />
        <div class="c-inspect-styles__content">
            <div v-if="staticStyle"
                 class="c-inspect-styles__style"
            >
                <style-editor class="c-inspect-styles__editor"
                              :style-item="staticStyle"
                              :is-editing="allowEditing"
                              :mixed-styles="mixedStyles"
                              :non-specific-font-properties="nonSpecificFontProperties"
                              @persist="updateStaticStyle"
                              @save-style="saveStyle"
                />
            </div>
            <button
                v-if="allowEditing"
                id="addConditionSet"
                class="c-button c-button--major c-toggle-styling-button labeled"
                @click="addConditionSet"
            >
                <span class="c-cs-button__label">Use Conditional Styling...</span>
            </button>
        </div>
    </template>
    <template v-else>
        <div class="c-inspect-styles__header">
            Conditional Object Styles
        </div>
        <div class="c-inspect-styles__content c-inspect-styles__condition-set">
            <a v-if="conditionSetDomainObject"
               class="c-object-label"
               :href="navigateToPath"
               @click="navigateOrPreview"
            >
                <span class="c-object-label__type-icon icon-conditional"></span>
                <span class="c-object-label__name">{{ conditionSetDomainObject.name }}</span>
            </a>
            <template v-if="allowEditing">
                <button
                    id="changeConditionSet"
                    class="c-button labeled"
                    @click="addConditionSet"
                >
                    <span class="c-button__label">Change...</span>
                </button>

                <button class="c-click-icon icon-x"
                        title="Remove conditional styles"
                        @click="removeConditionSet"
                ></button>
            </template>
        </div>

        <FontStyleEditor
            v-if="canStyleFont"
            :font-style="consolidatedFontStyle"
            @set-font-property="setFontProperty"
        />

        <div v-if="conditionsLoaded"
             class="c-inspect-styles__conditions"
        >
            <div v-for="(conditionStyle, index) in conditionalStyles"
                 :key="index"
                 class="c-inspect-styles__condition"
                 :class="{'is-current': conditionStyle.conditionId === selectedConditionId}"
                 @click="applySelectedConditionStyle(conditionStyle.conditionId)"
            >
                <condition-error :show-label="true"
                                 :condition="getCondition(conditionStyle.conditionId)"
                />
                <condition-description :show-label="true"
                                       :condition="getCondition(conditionStyle.conditionId)"
                />
                <style-editor class="c-inspect-styles__editor"
                              :style-item="conditionStyle"
                              :non-specific-font-properties="nonSpecificFontProperties"
                              :is-editing="allowEditing"
                              @persist="updateConditionalStyle"
                              @save-style="saveStyle"
                />
            </div>
        </div>
    </template>
</div>
</template>

<script>

import FontStyleEditor from '@/ui/inspector/styles/FontStyleEditor.vue';
import StyleEditor from "./StyleEditor.vue";
import PreviewAction from "@/ui/preview/PreviewAction.js";
import { getApplicableStylesForItem, getConsolidatedStyleValues, getConditionSetIdentifierForItem } from "@/plugins/condition/utils/styleUtils";
import ConditionSetSelectorDialog from "@/plugins/condition/components/inspector/ConditionSetSelectorDialog.vue";
import ConditionError from "@/plugins/condition/components/ConditionError.vue";
import ConditionDescription from "@/plugins/condition/components/ConditionDescription.vue";
import Vue from 'vue';

const NON_SPECIFIC = '??';
const NON_STYLEABLE_CONTAINER_TYPES = [
    'layout',
    'flexible-layout',
    'tabs'
];
const NON_STYLEABLE_LAYOUT_ITEM_TYPES = [
    'line-view',
    'box-view',
    'image-view'
];

export default {
    name: 'StylesView',
    components: {
        FontStyleEditor,
        StyleEditor,
        ConditionError,
        ConditionDescription
    },
    inject: [
        'openmct',
        'selection',
        'stylesManager'
    ],
    data() {
        return {
            staticStyle: undefined,
            isEditing: this.openmct.editor.isEditing(),
            mixedStyles: [],
            isStaticAndConditionalStyles: false,
            conditionalStyles: [],
            conditionSetDomainObject: undefined,
            conditions: undefined,
            conditionsLoaded: false,
            navigateToPath: '',
            selectedConditionId: '',
            items: [],
            domainObject: undefined,
            consolidatedFontStyle: {}
        };
    },
    computed: {
        locked() {
            return this.selection.some(selectionPath => {
                const self = selectionPath[0].context.item;
                const parent = selectionPath.length > 1 ? selectionPath[1].context.item : undefined;

                return (self && self.locked) || (parent && parent.locked);
            });
        },
        allowEditing() {
            return this.isEditing && !this.locked;
        },
        styleableFontItems() {
            return this.selection.filter(selectionPath => {
                const item = selectionPath[0].context.item;
                const itemType = item && item.type;
                const layoutItem = selectionPath[0].context.layoutItem;
                const layoutItemType = layoutItem && layoutItem.type;

                if (itemType && NON_STYLEABLE_CONTAINER_TYPES.includes(itemType)) {
                    return false;
                }

                if (layoutItemType && NON_STYLEABLE_LAYOUT_ITEM_TYPES.includes(layoutItemType)) {
                    return false;
                }

                return true;
            });
        },
        computedconsolidatedFontStyle() {
            let consolidatedFontStyle;
            const styles = [];

            this.styleableFontItems.forEach(styleable => {
                const fontStyle = this.getFontStyle(styleable[0]);

                styles.push(fontStyle);
            });

            if (styles.length) {
                const hasConsolidatedFontSize = styles.length && styles.every((fontStyle, i, arr) => fontStyle.fontSize === arr[0].fontSize);
                const hasConsolidatedFont = styles.length && styles.every((fontStyle, i, arr) => fontStyle.font === arr[0].font);

                consolidatedFontStyle = {
                    fontSize: hasConsolidatedFontSize ? styles[0].fontSize : NON_SPECIFIC,
                    font: hasConsolidatedFont ? styles[0].font : NON_SPECIFIC
                };
            }

            return consolidatedFontStyle;
        },
        nonSpecificFontProperties() {
            if (!this.consolidatedFontStyle) {
                return [];
            }

            return Object.keys(this.consolidatedFontStyle).filter(property => this.consolidatedFontStyle[property] === NON_SPECIFIC);
        },
        canStyleFont() {
            return this.styleableFontItems.length && this.allowEditing;
        }
    },
    destroyed() {
        this.removeListeners();
        this.openmct.editor.off('isEditing', this.setEditState);
        this.stylesManager.off('styleSelected', this.applyStyleToSelection);
    },
    mounted() {
        this.previewAction = new PreviewAction(this.openmct);
        this.isMultipleSelection = this.selection.length > 1;
        this.getObjectsAndItemsFromSelection();
        if (!this.isMultipleSelection) {
            let objectStyles = this.getObjectStyles();
            this.initializeStaticStyle(objectStyles);
            if (objectStyles && objectStyles.conditionSetIdentifier) {
                this.openmct.objects.get(objectStyles.conditionSetIdentifier).then(this.initialize);
                this.conditionalStyles = objectStyles.styles;
            }
        } else {
            this.initializeStaticStyle();
        }

        this.setConsolidatedFontStyle();

        this.openmct.editor.on('isEditing', this.setEditState);
        this.stylesManager.on('styleSelected', this.applyStyleToSelection);
    },
    methods: {
        getObjectStyles() {
            let objectStyles;
            if (this.domainObjectsById) {
                const domainObject = Object.values(this.domainObjectsById)[0];
                if (domainObject.configuration && domainObject.configuration.objectStyles) {
                    objectStyles = domainObject.configuration.objectStyles;
                }
            } else if (this.items.length) {
                const itemId = this.items[0].id;
                if (this.domainObject && this.domainObject.configuration && this.domainObject.configuration.objectStyles && this.domainObject.configuration.objectStyles[itemId]) {
                    objectStyles = this.domainObject.configuration.objectStyles[itemId];
                }
            } else if (this.domainObject && this.domainObject.configuration && this.domainObject.configuration.objectStyles) {
                objectStyles = this.domainObject.configuration.objectStyles;
            }

            return objectStyles;
        },
        setEditState(isEditing) {
            this.isEditing = isEditing;
            if (this.isEditing) {
                if (this.stopProvidingTelemetry) {
                    this.stopProvidingTelemetry();
                    delete this.stopProvidingTelemetry;
                }
            } else {
                this.subscribeToConditionSet();
            }
        },
        enableConditionSetNav() {
            this.openmct.objects.getOriginalPath(this.conditionSetDomainObject.identifier).then(
                (objectPath) => {
                    this.objectPath = objectPath;
                    this.navigateToPath = '#/browse/' + this.objectPath
                        .map(o => o && this.openmct.objects.makeKeyString(o.identifier))
                        .reverse()
                        .join('/');
                }
            );
        },
        navigateOrPreview(event) {
            // If editing, display condition set in Preview overlay; otherwise nav to it while browsing
            if (this.openmct.editor.isEditing()) {
                event.preventDefault();
                this.previewAction.invoke(this.objectPath);
            }
        },
        isItemType(type, item) {
            return item && (item.type === type);
        },
        canPersistObject(item) {
            // for now the only way to tell if an object can be persisted is if it is creatable.
            let creatable = false;
            if (item) {
                const type = this.openmct.types.get(item.type);
                if (type && type.definition) {
                    creatable = (type.definition.creatable === true);
                }
            }

            return creatable;
        },
        hasConditionalStyle(domainObject, layoutItem) {
            const id = layoutItem ? layoutItem.id : undefined;

            return getConditionSetIdentifierForItem(domainObject, id) !== undefined;
        },
        getObjectsAndItemsFromSelection() {
            let domainObject;
            let subObjects = [];
            let itemsWithConditionalStyles = 0;

            //multiple selection
            let itemInitialStyles = [];
            let itemStyle;
            this.selection.forEach((selectionItem) => {
                const item = selectionItem[0].context.item;
                const layoutItem = selectionItem[0].context.layoutItem;
                const isChildItem = selectionItem.length > 1;

                if (!item && !layoutItem) {
                    // cases where selection is used for table cells
                    return;
                }

                if (!isChildItem) {
                    domainObject = item;
                    itemStyle = getApplicableStylesForItem(item);
                    if (this.hasConditionalStyle(item)) {
                        itemsWithConditionalStyles += 1;
                    }
                } else {
                    this.canHide = true;
                    domainObject = selectionItem[1].context.item;
                    if (item && !layoutItem || (this.isItemType('subobject-view', layoutItem) && this.canPersistObject(item))) {
                        subObjects.push(item);
                        itemStyle = getApplicableStylesForItem(item);
                        if (this.hasConditionalStyle(item)) {
                            itemsWithConditionalStyles += 1;
                        }
                    } else {
                        itemStyle = getApplicableStylesForItem(domainObject, layoutItem || item);
                        this.items.push({
                            id: layoutItem.id,
                            applicableStyles: itemStyle
                        });
                        if (this.hasConditionalStyle(item, layoutItem)) {
                            itemsWithConditionalStyles += 1;
                        }
                    }
                }

                itemInitialStyles.push(itemStyle);
            });
            this.isStaticAndConditionalStyles = this.isMultipleSelection && itemsWithConditionalStyles;
            const {styles, mixedStyles} = getConsolidatedStyleValues(itemInitialStyles);
            this.initialStyles = styles;
            this.mixedStyles = mixedStyles;
            // main layout
            this.domainObject = domainObject;
            this.removeListeners();
            if (this.domainObject) {
                this.stopObserving = this.openmct.objects.observe(this.domainObject, '*', newDomainObject => this.domainObject = newDomainObject);
                this.stopObservingItems = this.openmct.objects.observe(this.domainObject, 'configuration.items', this.updateDomainObjectItemStyles);
            }

            subObjects.forEach(this.registerListener);
        },
        updateDomainObjectItemStyles(newItems) {
            let keys = Object.keys(this.domainObject.configuration.objectStyles || {});
            keys.forEach((key) => {
                if (this.isKeyItemId(key)) {
                    if (!(newItems.find(item => item.id === key))) {
                        this.removeItemStyles(key);
                    }
                }
            });
        },
        isKeyItemId(key) {
            return (key !== 'styles')
                && (key !== 'staticStyle')
                && (key !== 'fontStyle')
                && (key !== 'defaultConditionId')
                && (key !== 'selectedConditionId')
                && (key !== 'conditionSetIdentifier');
        },
        registerListener(domainObject) {
            let id = this.openmct.objects.makeKeyString(domainObject.identifier);

            if (!this.domainObjectsById) {
                this.domainObjectsById = {};
            }

            if (!this.domainObjectsById[id]) {
                this.domainObjectsById[id] = domainObject;
                this.observeObject(domainObject, id);
            }
        },
        observeObject(domainObject, id) {
            let unobserveObject = this.openmct.objects.observe(domainObject, '*', (newObject) => {
                this.domainObjectsById[id] = JSON.parse(JSON.stringify(newObject));
            });
            this.unObserveObjects.push(unobserveObject);
        },
        removeListeners() {
            if (this.stopObserving) {
                this.stopObserving();
            }

            if (this.stopObservingItems) {
                this.stopObservingItems();
            }

            if (this.stopProvidingTelemetry) {
                this.stopProvidingTelemetry();
                delete this.stopProvidingTelemetry;
            }

            if (this.unObserveObjects) {
                this.unObserveObjects.forEach((unObserveObject) => {
                    unObserveObject();
                });
            }

            this.unObserveObjects = [];
        },
        subscribeToConditionSet() {
            if (this.stopProvidingTelemetry) {
                this.stopProvidingTelemetry();
                delete this.stopProvidingTelemetry;
            }

            if (this.conditionSetDomainObject) {
                this.openmct.telemetry.request(this.conditionSetDomainObject)
                    .then(output => {
                        if (output && output.length) {
                            this.handleConditionSetResultUpdated(output[0]);
                        }
                    });
                this.stopProvidingTelemetry = this.openmct.telemetry.subscribe(this.conditionSetDomainObject, this.handleConditionSetResultUpdated.bind(this));
            }
        },
        handleConditionSetResultUpdated(resultData) {
            this.selectedConditionId = resultData ? resultData.conditionId : '';
        },
        initialize(conditionSetDomainObject) {
            //If there are new conditions in the conditionSet we need to set those styles to default
            this.conditionSetDomainObject = conditionSetDomainObject;
            this.enableConditionSetNav();
            this.initializeConditionalStyles();
        },
        initializeConditionalStyles() {
            if (!this.conditions) {
                this.conditions = {};
            }

            let conditionalStyles = [];
            this.conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                if (conditionConfiguration.isDefault) {
                    this.selectedConditionId = conditionConfiguration.id;
                }

                this.conditions[conditionConfiguration.id] = conditionConfiguration;
                let foundStyle = this.findStyleByConditionId(conditionConfiguration.id);
                if (foundStyle) {
                    foundStyle.style = Object.assign((this.canHide ? { isStyleInvisible: '' } : {}), this.initialStyles, foundStyle.style);
                    conditionalStyles.push(foundStyle);
                } else {
                    conditionalStyles.splice(index, 0, {
                        conditionId: conditionConfiguration.id,
                        style: Object.assign((this.canHide ? { isStyleInvisible: '' } : {}), this.initialStyles)
                    });
                }
            });
            //we're doing this so that we remove styles for any conditions that have been removed from the condition set
            this.conditionalStyles = conditionalStyles;
            this.conditionsLoaded = true;
            this.getAndPersistStyles(null, this.selectedConditionId);
            if (!this.isEditing) {
                this.subscribeToConditionSet();
            }
        },
        //TODO: Double check how this works for single styles
        initializeStaticStyle(objectStyles) {
            let staticStyle = objectStyles && objectStyles.staticStyle;
            if (staticStyle) {
                this.staticStyle = {
                    style: Object.assign({}, this.initialStyles, staticStyle.style)
                };
            } else {
                this.staticStyle = {
                    style: Object.assign({}, this.initialStyles)
                };
            }
        },
        removeItemStyles(itemId) {
            let domainObjectStyles = (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};
            if (itemId && domainObjectStyles[itemId]) {
                delete domainObjectStyles[itemId];

                if (Object.keys(domainObjectStyles).length <= 0) {
                    domainObjectStyles = undefined;
                }

                this.persist(this.domainObject, domainObjectStyles);
            }
        },
        findStyleByConditionId(id) {
            return this.conditionalStyles.find(conditionalStyle => conditionalStyle.conditionId === id);
        },
        getCondition(id) {
            return this.conditions ? this.conditions[id] : {};
        },
        addConditionSet() {
            let conditionSetDomainObject;
            let self = this;
            function handleItemSelection(item) {
                if (item) {
                    conditionSetDomainObject = item;
                }
            }

            function dismissDialog(overlay, initialize) {
                overlay.dismiss();

                if (initialize && conditionSetDomainObject) {
                    self.conditionSetDomainObject = conditionSetDomainObject;
                    self.conditionalStyles = [];
                    self.initializeConditionalStyles();
                }
            }

            let vm = new Vue({
                provide: {
                    openmct: this.openmct
                },
                components: {ConditionSetSelectorDialog},
                data() {
                    return {
                        handleItemSelection
                    };
                },
                template: '<condition-set-selector-dialog @conditionSetSelected="handleItemSelection"></condition-set-selector-dialog>'
            }).$mount();

            let overlay = this.openmct.overlays.overlay({
                element: vm.$el,
                size: 'small',
                buttons: [
                    {
                        label: 'OK',
                        emphasis: 'true',
                        callback: () => dismissDialog(overlay, true)
                    },
                    {
                        label: 'Cancel',
                        callback: () => dismissDialog(overlay, false)
                    }
                ],
                onDestroy: () => vm.$destroy()
            });
        },
        removeConditionSet() {
            this.conditionSetDomainObject = undefined;
            this.conditionalStyles = [];
            let domainObjectStyles = (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};
            if (this.domainObjectsById) {
                const domainObjects = Object.values(this.domainObjectsById);
                domainObjects.forEach(domainObject => {
                    let objectStyles = (domainObject.configuration && domainObject.configuration.objectStyles) || {};
                    this.removeConditionalStyles(objectStyles);
                    if (objectStyles && Object.keys(objectStyles).length <= 0) {
                        objectStyles = undefined;
                    }

                    this.persist(domainObject, objectStyles);
                });
            }

            if (this.items.length) {
                this.items.forEach((item) => {
                    const itemId = item.id;
                    this.removeConditionalStyles(domainObjectStyles, itemId);
                    if (domainObjectStyles[itemId] && Object.keys(domainObjectStyles[itemId]).length <= 0) {
                        delete domainObjectStyles[itemId];
                    }
                });
            } else {
                this.removeConditionalStyles(domainObjectStyles);
            }

            if (domainObjectStyles && Object.keys(domainObjectStyles).length <= 0) {
                domainObjectStyles = undefined;
            }

            this.persist(this.domainObject, domainObjectStyles);

            if (this.stopProvidingTelemetry) {
                this.stopProvidingTelemetry();
                delete this.stopProvidingTelemetry;
            }
        },
        removeConditionalStyles(domainObjectStyles, itemId) {
            if (itemId && domainObjectStyles[itemId]) {
                domainObjectStyles[itemId].conditionSetIdentifier = undefined;
                delete domainObjectStyles[itemId].conditionSetIdentifier;
                domainObjectStyles[itemId].selectedConditionId = undefined;
                domainObjectStyles[itemId].defaultConditionId = undefined;
                domainObjectStyles[itemId].styles = undefined;
                delete domainObjectStyles[itemId].styles;
            } else {
                domainObjectStyles.conditionSetIdentifier = undefined;
                delete domainObjectStyles.conditionSetIdentifier;
                domainObjectStyles.selectedConditionId = undefined;
                domainObjectStyles.defaultConditionId = undefined;
                domainObjectStyles.styles = undefined;
                delete domainObjectStyles.styles;
            }
        },
        updateStaticStyle(staticStyle, property) {
            //update the static style for each of the layoutItems as well as each sub object item
            this.staticStyle = staticStyle;
            this.removeConditionSet();
            this.getAndPersistStyles(property);
        },
        updateConditionalStyle(conditionStyle, property) {
            let foundStyle = this.findStyleByConditionId(conditionStyle.conditionId);
            if (foundStyle) {
                foundStyle.style = conditionStyle.style;
                this.selectedConditionId = foundStyle.conditionId;
                this.getAndPersistStyles(property);
            }
        },
        getAndPersistStyles(property, defaultConditionId) {
            this.persist(this.domainObject, this.getDomainObjectStyle(this.domainObject, property, this.items, defaultConditionId));
            if (this.domainObjectsById) {
                const domainObjects = Object.values(this.domainObjectsById);
                domainObjects.forEach(domainObject => {
                    this.persist(domainObject, this.getDomainObjectStyle(domainObject, property, null, defaultConditionId));
                });
            }

            if (!this.items.length && !this.domainObjectsById) {
                this.persist(this.domainObject, this.getDomainObjectStyle(this.domainObject, property, null, defaultConditionId));
            }

            this.isStaticAndConditionalStyles = false;
            if (property) {
                let foundIndex = this.mixedStyles.indexOf(property);
                if (foundIndex > -1) {
                    this.mixedStyles.splice(foundIndex, 1);
                }
            }
        },
        getDomainObjectStyle(domainObject, property, items, defaultConditionId) {
            let objectStyle = {
                styles: this.conditionalStyles,
                staticStyle: this.staticStyle,
                selectedConditionId: this.selectedConditionId
            };
            if (defaultConditionId) {
                objectStyle.defaultConditionId = defaultConditionId;
            }

            if (this.conditionSetDomainObject) {
                objectStyle.conditionSetIdentifier = this.conditionSetDomainObject.identifier;
            }

            let domainObjectStyles = (domainObject.configuration && domainObject.configuration.objectStyles) || {};

            if (items) {
                items.forEach(item => {
                    let itemStaticStyle = {};
                    let itemConditionalStyle = { styles: []};
                    if (!this.conditionSetDomainObject) {
                        if (domainObjectStyles[item.id] && domainObjectStyles[item.id].staticStyle) {
                            itemStaticStyle = Object.assign({}, domainObjectStyles[item.id].staticStyle.style);
                        }

                        if (item.applicableStyles[property] !== undefined) {
                            itemStaticStyle[property] = this.staticStyle.style[property];
                        }

                        if (Object.keys(itemStaticStyle).length <= 0) {
                            itemStaticStyle = undefined;
                        }

                        domainObjectStyles[item.id] = { staticStyle: { style: itemStaticStyle } };
                    } else {
                        objectStyle.styles.forEach((conditionalStyle, index) => {
                            let style = {};
                            Object.keys(item.applicableStyles).concat(['isStyleInvisible']).forEach(key => {
                                style[key] = conditionalStyle.style[key];
                            });
                            itemConditionalStyle.styles.push({
                                ...conditionalStyle,
                                style
                            });
                        });
                        domainObjectStyles[item.id] = {
                            ...domainObjectStyles[item.id],
                            ...objectStyle,
                            ...itemConditionalStyle
                        };
                    }
                });
            } else {
                domainObjectStyles = {
                    ...domainObjectStyles,
                    ...objectStyle
                };
            }

            return domainObjectStyles;
        },
        applySelectedConditionStyle(conditionId) {
            this.selectedConditionId = conditionId;
            this.getAndPersistStyles();
        },
        persist(domainObject, style) {
            this.openmct.objects.mutate(domainObject, 'configuration.objectStyles', style);
        },
        applyStyleToSelection(style) {
            if (!this.allowEditing) {
                return;
            }

            this.updateSelectionFontStyle(style);
            this.updateSelectionStyle(style);
        },
        updateSelectionFontStyle(style) {
            const fontSizeProperty = {
                fontSize: style.fontSize
            };
            const fontProperty = {
                font: style.font
            };

            this.setFontProperty(fontSizeProperty);
            this.setFontProperty(fontProperty);
        },
        updateSelectionStyle(style) {
            const foundStyle = this.findStyleByConditionId(this.selectedConditionId);

            if (foundStyle && !this.isStaticAndConditionalStyles) {
                Object.entries(style).forEach(([property, value]) => {
                    if (foundStyle.style[property] !== undefined && foundStyle.style[property] !== value) {
                        foundStyle.style[property] = value;
                    }
                });
                this.getAndPersistStyles();
            } else {
                this.removeConditionSet();
                Object.entries(style).forEach(([property, value]) => {
                    if (this.staticStyle.style[property] !== undefined && this.staticStyle.style[property] !== value) {
                        this.staticStyle.style[property] = value;
                        this.getAndPersistStyles(property);
                    }
                });
            }
        },
        saveStyle(style) {
            const styleToSave = {
                ...style,
                ...this.consolidatedFontStyle
            };

            this.stylesManager.save(styleToSave);
        },
        setConsolidatedFontStyle() {
            const styles = [];

            this.styleableFontItems.forEach(styleable => {
                const fontStyle = this.getFontStyle(styleable[0]);

                styles.push(fontStyle);
            });

            if (styles.length) {
                const hasConsolidatedFontSize = styles.length && styles.every((fontStyle, i, arr) => fontStyle.fontSize === arr[0].fontSize);
                const hasConsolidatedFont = styles.length && styles.every((fontStyle, i, arr) => fontStyle.font === arr[0].font);

                const fontSize = hasConsolidatedFontSize ? styles[0].fontSize : NON_SPECIFIC;
                const font = hasConsolidatedFont ? styles[0].font : NON_SPECIFIC;

                this.$set(this.consolidatedFontStyle, 'fontSize', fontSize);
                this.$set(this.consolidatedFontStyle, 'font', font);
            }
        },
        getFontStyle(selectionPath) {
            const item = selectionPath.context.item;
            const layoutItem = selectionPath.context.layoutItem;
            let fontStyle = item && item.configuration && item.configuration.fontStyle;

            // support for legacy where font styling in layouts only
            if (!fontStyle) {
                fontStyle = {
                    fontSize: layoutItem && layoutItem.fontSize || 'default',
                    font: layoutItem && layoutItem.font || 'default'
                };
            }

            return fontStyle;
        },
        setFontProperty(fontStyleObject) {
            let layoutDomainObject;
            const [property, value] = Object.entries(fontStyleObject)[0];

            this.styleableFontItems.forEach(styleable => {
                if (!this.isLayoutObject(styleable)) {
                    const fontStyle = this.getFontStyle(styleable[0]);
                    fontStyle[property] = value;

                    this.openmct.objects.mutate(styleable[0].context.item, 'configuration.fontStyle', fontStyle);
                } else {
                    // all layoutItems in this context will share same parent layout
                    if (!layoutDomainObject) {
                        layoutDomainObject = styleable[1].context.item;
                    }

                    // save layout item font style to parent layout configuration
                    const layoutItemIndex = styleable[0].context.index;
                    const layoutItemConfiguration = layoutDomainObject.configuration.items[layoutItemIndex];

                    layoutItemConfiguration[property] = value;
                }
            });

            if (layoutDomainObject) {
                this.openmct.objects.mutate(layoutDomainObject, 'configuration.items', layoutDomainObject.configuration.items);
            }

            // sync vue component on font update
            this.$set(this.consolidatedFontStyle, property, value);
        },
        isLayoutObject(selectionPath) {
            const layoutItemType = selectionPath[0].context.layoutItem && selectionPath[0].context.layoutItem.type;

            return layoutItemType && layoutItemType !== 'subobject-view';
        }
    }
};
</script>
