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
    <template v-if="!conditionSetDomainObject">
        <div class="c-inspect-styles__header">
            Object Style
        </div>
        <div class="c-inspect-styles__content">
            <div v-if="staticStyle"
                 class="c-inspect-styles__style"
            >
                <style-editor class="c-inspect-styles__editor"
                              :style-item="staticStyle"
                              :is-editing="isEditing"
                              @persist="updateStaticStyle"
                />
            </div>
            <button
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
               class="c-object-label icon-conditional"
               :href="navigateToPath"
               @click="navigateOrPreview"
            >
                <span class="c-object-label__name">{{ conditionSetDomainObject.name }}</span>
            </a>
            <template v-if="isEditing">
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
                              :is-editing="isEditing"
                              @persist="updateConditionalStyle"
                />
            </div>
        </div>
    </template>
</div>
</template>

<script>

import StyleEditor from "./StyleEditor.vue";
import ConditionSetSelectorDialog from "./ConditionSetSelectorDialog.vue";
import ConditionDescription from "@/plugins/condition/components/ConditionDescription.vue";
import ConditionError from "@/plugins/condition/components/ConditionError.vue";
import Vue from 'vue';
import PreviewAction from "@/ui/preview/PreviewAction.js";
import {getApplicableStylesForItem} from "@/plugins/condition/utils/styleUtils";
import isEmpty from 'lodash/isEmpty';

export default {
    name: 'ConditionalStylesView',
    components: {
        ConditionDescription,
        ConditionError,
        StyleEditor
    },
    inject: [
        'openmct',
        'selection'
    ],
    data() {
        return {
            conditionalStyles: [],
            staticStyle: undefined,
            conditionSetDomainObject: undefined,
            isEditing: this.openmct.editor.isEditing(),
            conditions: undefined,
            conditionsLoaded: false,
            navigateToPath: '',
            selectedConditionId: ''
        };
    },
    destroyed() {
        this.removeListeners();
    },
    mounted() {
        this.itemId = '';
        this.getDomainObjectFromSelection();
        this.previewAction = new PreviewAction(this.openmct);
        if (this.domainObject.configuration && this.domainObject.configuration.objectStyles) {
            let objectStyles = this.itemId ? this.domainObject.configuration.objectStyles[this.itemId] : this.domainObject.configuration.objectStyles;
            this.initializeStaticStyle(objectStyles);
            if (objectStyles && objectStyles.conditionSetIdentifier) {
                this.openmct.objects.get(objectStyles.conditionSetIdentifier).then(this.initialize);
                this.conditionalStyles = objectStyles.styles;
            }
        } else {
            this.initializeStaticStyle();
        }

        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        isItemType(type, item) {
            return item && (item.type === type);
        },
        getDomainObjectFromSelection() {
            let layoutItem;
            let domainObject;

            if (this.selection[0].length > 1) {
                //If there are more than 1 items in the this.selection[0] list, the first one could either be a sub domain object OR a layout drawing control.
                //The second item in the this.selection[0] list is the container object (usually a layout)
                layoutItem = this.selection[0][0].context.layoutItem;
                const item = this.selection[0][0].context.item;
                this.canHide = true;
                if (item
                    && (!layoutItem || (this.isItemType('subobject-view', layoutItem)))) {
                    domainObject = item;
                } else {
                    domainObject = this.selection[0][1].context.item;
                    if (layoutItem) {
                        this.itemId = layoutItem.id;
                    }
                }
            } else {
                domainObject = this.selection[0][0].context.item;
            }

            this.domainObject = domainObject;
            this.initialStyles = getApplicableStylesForItem(domainObject, layoutItem);
            this.$nextTick(() => {
                this.removeListeners();
                if (this.domainObject) {
                    this.stopObserving = this.openmct.objects.observe(this.domainObject, '*', newDomainObject => this.domainObject = newDomainObject);
                    this.stopObservingItems = this.openmct.objects.observe(this.domainObject, 'configuration.items', this.updateDomainObjectItemStyles);
                }
            });
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
        },
        initialize(conditionSetDomainObject) {
            //If there are new conditions in the conditionSet we need to set those styles to default
            this.conditionSetDomainObject = conditionSetDomainObject;
            this.enableConditionSetNav();
            this.initializeConditionalStyles();
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
        removeConditionSet() {
            this.conditionSetDomainObject = undefined;
            this.conditionalStyles = [];
            let domainObjectStyles = (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};
            if (this.itemId) {
                domainObjectStyles[this.itemId].conditionSetIdentifier = undefined;
                domainObjectStyles[this.itemId].selectedConditionId = undefined;
                domainObjectStyles[this.itemId].defaultConditionId = undefined;
                delete domainObjectStyles[this.itemId].conditionSetIdentifier;
                domainObjectStyles[this.itemId].styles = undefined;
                delete domainObjectStyles[this.itemId].styles;
                if (isEmpty(domainObjectStyles[this.itemId])) {
                    delete domainObjectStyles[this.itemId];
                }
            } else {
                domainObjectStyles.conditionSetIdentifier = undefined;
                domainObjectStyles.selectedConditionId = undefined;
                domainObjectStyles.defaultConditionId = undefined;
                delete domainObjectStyles.conditionSetIdentifier;
                domainObjectStyles.styles = undefined;
                delete domainObjectStyles.styles;
            }

            if (isEmpty(domainObjectStyles)) {
                domainObjectStyles = undefined;
            }

            this.persist(domainObjectStyles);
            if (this.stopProvidingTelemetry) {
                this.stopProvidingTelemetry();
                delete this.stopProvidingTelemetry;
            }
        },
        updateDomainObjectItemStyles(newItems) {
            //check that all items that have been styles still exist. Otherwise delete those styles
            let domainObjectStyles = (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};
            let itemsToRemove = [];
            let keys = Object.keys(domainObjectStyles);
            //TODO: Need an easier way to find which properties are itemIds
            keys.forEach((key) => {
                const keyIsItemId = (key !== 'styles')
                    && (key !== 'staticStyle')
                    && (key !== 'defaultConditionId')
                    && (key !== 'selectedConditionId')
                    && (key !== 'conditionSetIdentifier');
                if (keyIsItemId) {
                    if (!(newItems.find(item => item.id === key))) {
                        itemsToRemove.push(key);
                    }
                }
            });
            if (itemsToRemove.length) {
                this.removeItemStyles(itemsToRemove, domainObjectStyles);
            }
        },
        removeItemStyles(itemIds, domainObjectStyles) {
            itemIds.forEach(itemId => {
                if (domainObjectStyles[itemId]) {
                    domainObjectStyles[itemId] = undefined;
                    delete domainObjectStyles[this.itemId];
                }
            });
            if (isEmpty(domainObjectStyles)) {
                domainObjectStyles = undefined;
            }

            this.persist(domainObjectStyles);
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
            this.persist(this.getDomainObjectConditionalStyle(this.selectedConditionId));
            if (!this.isEditing) {
                this.subscribeToConditionSet();
            }
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
        findStyleByConditionId(id) {
            return this.conditionalStyles.find(conditionalStyle => conditionalStyle.conditionId === id);
        },
        updateStaticStyle(staticStyle) {
            this.staticStyle = staticStyle;
            this.persist(this.getDomainObjectConditionalStyle());
        },
        updateConditionalStyle(conditionStyle) {
            let found = this.findStyleByConditionId(conditionStyle.conditionId);
            if (found) {
                found.style = conditionStyle.style;
                this.selectedConditionId = found.conditionId;
                this.persist(this.getDomainObjectConditionalStyle());
            }
        },
        getDomainObjectConditionalStyle(defaultConditionId) {
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

            let domainObjectStyles = (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};

            if (this.itemId) {
                domainObjectStyles[this.itemId] = objectStyle;
            } else {
                //we're deconstructing here to ensure that if an item within a domainObject already had a style we don't lose it
                domainObjectStyles = {
                    ...domainObjectStyles,
                    ...objectStyle
                };
            }

            return domainObjectStyles;
        },
        getCondition(id) {
            return this.conditions ? this.conditions[id] : {};
        },
        applySelectedConditionStyle(conditionId) {
            this.selectedConditionId = conditionId;
            this.persist(this.getDomainObjectConditionalStyle());
        },
        persist(style) {
            this.openmct.objects.mutate(this.domainObject, 'configuration.objectStyles', style);
        }
    }
};
</script>
