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
    <div class="c-inspect-styles__header">
        Object Style
    </div>
    <div class="c-inspect-styles__content">
        <div v-if="isStaticAndConditionalStyles"
             class="c-inspect-styles__mixed-static-and-conditional u-alert u-alert--block u-alert--with-icon"
        >
            Your selection includes one or more items that use Conditional Styling. Applying a static style below will replace any Conditional Styling with the new choice.
        </div>
        <div v-if="staticStyle"
             class="c-inspect-styles__style"
        >
            <style-editor class="c-inspect-styles__editor"
                          :style-item="staticStyle"
                          :is-editing="isEditing"
                          :mixed-styles="mixedStyles"
                          @persist="updateStaticStyle"
            />
        </div>
    </div>
</div>
</template>

<script>

import StyleEditor from "./StyleEditor.vue";
import PreviewAction from "@/ui/preview/PreviewAction.js";
import { getApplicableStylesForItem, getConsolidatedStyleValues, getConditionalStyleForItem } from "@/plugins/condition/utils/styleUtils";
import isEmpty from 'lodash/isEmpty';

export default {
    name: 'MultiSelectStylesView',
    components: {
        StyleEditor
    },
    inject: [
        'openmct',
        'selection'
    ],
    data() {
        return {
            staticStyle: undefined,
            isEditing: this.openmct.editor.isEditing(),
            mixedStyles: [],
            isStaticAndConditionalStyles: false
        };
    },
    destroyed() {
        this.removeListeners();
    },
    mounted() {
        this.items = [];
        this.previewAction = new PreviewAction(this.openmct);
        this.getObjectsAndItemsFromSelection();
        this.initializeStaticStyle();
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        isItemType(type, item) {
            return item && (item.type === type);
        },
        hasConditionalStyles(domainObject, id) {
            return getConditionalStyleForItem(domainObject, id) !== undefined;
        },
        getObjectsAndItemsFromSelection() {
            let domainObject;
            let subObjects = [];

            //multiple selection
            let itemInitialStyles = [];
            let itemStyle;
            this.selection.forEach((selectionItem) => {
                const item = selectionItem[0].context.item;
                const layoutItem = selectionItem[0].context.layoutItem;
                if (item && this.isItemType('subobject-view', layoutItem)) {
                    subObjects.push(item);
                    itemStyle = getApplicableStylesForItem(item);
                    if (!this.isStaticAndConditionalStyles) {
                        this.isStaticAndConditionalStyles = this.hasConditionalStyles(item);
                    }
                } else {
                    domainObject = selectionItem[1].context.item;
                    itemStyle = getApplicableStylesForItem(domainObject, layoutItem || item);
                    this.items.push({
                        id: layoutItem.id,
                        applicableStyles: itemStyle
                    });
                    if (!this.isStaticAndConditionalStyles) {
                        this.isStaticAndConditionalStyles = this.hasConditionalStyles(domainObject, layoutItem.id);
                    }
                }

                itemInitialStyles.push(itemStyle);
            });
            const {styles, mixedStyles} = getConsolidatedStyleValues(itemInitialStyles);
            this.initialStyles = styles;
            this.mixedStyles = mixedStyles;

            this.domainObject = domainObject;
            this.removeListeners();
            if (this.domainObject) {
                this.stopObserving = this.openmct.objects.observe(this.domainObject, '*', newDomainObject => this.domainObject = newDomainObject);
                this.stopObservingItems = this.openmct.objects.observe(this.domainObject, 'configuration.items', this.updateDomainObjectItemStyles);
            }

            subObjects.forEach(this.registerListener);
        },
        updateDomainObjectItemStyles(newItems) {
            //check that all items that have been styles still exist. Otherwise delete those styles
            let keys = Object.keys(this.domainObject.configuration.objectStyles || {});
            keys.forEach((key) => {
                if ((key !== 'styles')
                    && (key !== 'staticStyle')
                    && (key !== 'conditionSetIdentifier')) {
                    if (!(newItems.find(item => item.id === key))) {
                        this.removeItemStyles(key);
                    }
                }
            });
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
            let unobserveObject = this.openmct.objects.observe(domainObject, '*', function (newObject) {
                this.domainObjectsById[id] = JSON.parse(JSON.stringify(newObject));
            }.bind(this));
            this.unObserveObjects.push(unobserveObject);
        },
        removeListeners() {
            if (this.stopObserving) {
                this.stopObserving();
            }

            if (this.stopObservingItems) {
                this.stopObservingItems();
            }

            if (this.unObserveObjects) {
                this.unObserveObjects.forEach((unObserveObject) => {
                    unObserveObject();
                });
            }

            this.unObserveObjects = [];
        },
        removeItemStyles(itemId) {
            let domainObjectStyles = (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};
            if (itemId && domainObjectStyles[itemId]) {
                domainObjectStyles[itemId] = undefined;
                delete domainObjectStyles[this.itemId];

                if (isEmpty(domainObjectStyles)) {
                    domainObjectStyles = undefined;
                }

                this.persist(this.domainObject, domainObjectStyles);
            }
        },
        removeConditionalStyles(domainObjectStyles, itemId) {
            if (itemId) {
                domainObjectStyles[itemId].conditionSetIdentifier = undefined;
                delete domainObjectStyles[itemId].conditionSetIdentifier;
                domainObjectStyles[itemId].styles = undefined;
                delete domainObjectStyles[itemId].styles;
            } else {
                domainObjectStyles.conditionSetIdentifier = undefined;
                delete domainObjectStyles.conditionSetIdentifier;
                domainObjectStyles.styles = undefined;
                delete domainObjectStyles.styles;
            }
        },
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        initializeStaticStyle() {
            this.staticStyle = {
                style: Object.assign({}, this.initialStyles)
            };
        },
        updateStaticStyle(staticStyle, property) {
            //update the static style for each of the layoutItems as well as each sub object item
            this.staticStyle = staticStyle;
            this.persist(this.domainObject, this.getDomainObjectStyle(this.domainObject, property, this.items));
            if (this.domainObjectsById) {
                const keys = Object.keys(this.domainObjectsById);
                keys.forEach(key => {
                    let domainObject = this.domainObjectsById[key];
                    this.persist(domainObject, this.getDomainObjectStyle(domainObject, property));
                });
            }

            this.isStaticAndConditionalStyles = false;
            let foundIndex = this.mixedStyles.indexOf(property);
            if (foundIndex > -1) {
                this.mixedStyles.splice(foundIndex, 1);
            }
        },
        getDomainObjectStyle(domainObject, property, items) {
            let domainObjectStyles = (domainObject.configuration && domainObject.configuration.objectStyles) || {};

            if (items) {
                items.forEach(item => {
                    let itemStaticStyle = {};
                    if (domainObjectStyles[item.id] && domainObjectStyles[item.id].staticStyle) {
                        itemStaticStyle = domainObjectStyles[item.id].staticStyle.style;
                    }

                    Object.keys(item.applicableStyles).forEach(key => {
                        if (property === key) {
                            itemStaticStyle[key] = this.staticStyle.style[key];
                        }
                    });
                    if (this.isStaticAndConditionalStyles) {
                        this.removeConditionalStyles(domainObjectStyles, item.id);
                    }

                    if (isEmpty(itemStaticStyle)) {
                        itemStaticStyle = undefined;
                        domainObjectStyles[item.id] = undefined;
                    } else {
                        domainObjectStyles[item.id] = Object.assign({}, { staticStyle: { style: itemStaticStyle } });
                    }
                });
            } else {
                if (!domainObjectStyles.staticStyle) {
                    domainObjectStyles.staticStyle = {
                        style: {}
                    };
                }

                if (this.isStaticAndConditionalStyles) {
                    this.removeConditionalStyles(domainObjectStyles);
                }

                domainObjectStyles.staticStyle.style[property] = this.staticStyle.style[property];
            }

            return domainObjectStyles;
        },

        persist(domainObject, style) {
            this.openmct.objects.mutate(domainObject, 'configuration.objectStyles', style);
        }
    }
};
</script>
