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
    class="l-layout u-style-receiver js-style-receiver"
    :class="{
        'is-multi-selected': selectedLayoutItems.length > 1,
        'allow-editing': isEditing
    }"
    @dragover="handleDragOver"
    @click.capture="bypassSelection"
    @drop="handleDrop"
>
    <display-layout-grid
        v-if="isEditing"
        :grid-size="gridSize"
        :show-grid="showGrid"
    />
    <div
        v-if="shouldDisplayLayoutDimensions"
        class="l-layout__dimensions"
        :style="layoutDimensionsStyle"
    >
        <div class="l-layout__dimensions-vals">
            {{ layoutDimensions[0] }},{{ layoutDimensions[1] }}
        </div>
    </div>
    <component
        :is="item.type"
        v-for="(item, index) in layoutItems"
        :key="item.id"
        :ref="`layout-item-${item.id}`"
        :item="item"
        :grid-size="gridSize"
        :init-select="initSelectIndex === index"
        :index="index"
        :multi-select="selectedLayoutItems.length > 1"
        :is-editing="isEditing"
        @move="move"
        @endMove="endMove"
        @endLineResize="endLineResize"
        @formatChanged="updateTelemetryFormat"
    />
    <edit-marquee
        v-if="showMarquee"
        :grid-size="gridSize"
        :selected-layout-items="selectedLayoutItems"
        @endResize="endResize"
    />
</div>
</template>

<script>
import uuid from 'uuid';
import SubobjectView from './SubobjectView.vue';
import TelemetryView from './TelemetryView.vue';
import BoxView from './BoxView.vue';
import TextView from './TextView.vue';
import LineView from './LineView.vue';
import ImageView from './ImageView.vue';
import EditMarquee from './EditMarquee.vue';
import DisplayLayoutGrid from './DisplayLayoutGrid.vue';
import _ from 'lodash';

const TELEMETRY_IDENTIFIER_FUNCTIONS = {
    'table': (domainObject) => {
        return Promise.resolve(domainObject.composition);
    },
    'telemetry.plot.overlay': (domainObject) => {
        return Promise.resolve(domainObject.composition);
    },
    'telemetry.plot.stacked': (domainObject, openmct) => {
        let composition = openmct.composition.get(domainObject);

        return composition.load().then((objects) => {
            let identifiers = [];
            objects.forEach(object => {
                if (object.type === 'telemetry.plot.overlay') {
                    identifiers.push(...object.composition);
                } else {
                    identifiers.push(object.identifier);
                }
            });

            return Promise.resolve(identifiers);
        });
    }
};

const ITEM_TYPE_VIEW_MAP = {
    'subobject-view': SubobjectView,
    'telemetry-view': TelemetryView,
    'box-view': BoxView,
    'line-view': LineView,
    'text-view': TextView,
    'image-view': ImageView
};
const ORDERS = {
    top: Number.POSITIVE_INFINITY,
    up: 1,
    down: -1,
    bottom: Number.NEGATIVE_INFINITY
};
const DRAG_OBJECT_TRANSFER_PREFIX = 'openmct/domain-object/';
const DUPLICATE_OFFSET = 3;

let components = ITEM_TYPE_VIEW_MAP;
components['edit-marquee'] = EditMarquee;
components['display-layout-grid'] = DisplayLayoutGrid;

function getItemDefinition(itemType, ...options) {
    let itemView = ITEM_TYPE_VIEW_MAP[itemType];

    if (!itemView) {
        throw `Invalid itemType: ${itemType}`;
    }

    return itemView.makeDefinition(...options);
}

export default {
    components: components,
    inject: ['openmct', 'options', 'objectPath'],
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            initSelectIndex: undefined,
            selection: [],
            showGrid: true
        };
    },
    computed: {
        gridSize() {
            return this.domainObject.configuration.layoutGrid;
        },
        layoutItems() {
            return this.domainObject.configuration.items;
        },
        selectedLayoutItems() {
            return this.layoutItems.filter(item => {
                return this.itemIsInCurrentSelection(item);
            });
        },
        layoutDimensions() {
            return this.domainObject.configuration.layoutDimensions;
        },
        shouldDisplayLayoutDimensions() {
            return this.layoutDimensions
                && this.layoutDimensions[0] > 0
                && this.layoutDimensions[1] > 0;
        },
        layoutDimensionsStyle() {
            const width = `${this.layoutDimensions[0]}px`;
            const height = `${this.layoutDimensions[1]}px`;

            return {
                width,
                height
            };
        },
        showMarquee() {
            let selectionPath = this.selection[0];
            let singleSelectedLine = this.selection.length === 1
                    && selectionPath[0].context.layoutItem && selectionPath[0].context.layoutItem.type === 'line-view';

            return this.isEditing && selectionPath && selectionPath.length > 1 && !singleSelectedLine;
        }
    },
    watch: {
        isEditing(value) {
            if (value) {
                this.showGrid = value;
            }
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.setSelection);
        this.initializeItems();
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addChild);
        this.composition.on('remove', this.removeChild);
        this.composition.load();
    },
    destroyed: function () {
        this.openmct.selection.off('change', this.setSelection);
        this.composition.off('add', this.addChild);
        this.composition.off('remove', this.removeChild);
    },
    methods: {
        addElement(itemType, element) {
            this.addItem(itemType + '-view', element);
        },
        setSelection(selection) {
            this.selection = selection;
        },
        itemIsInCurrentSelection(item) {
            return this.selection.some(selectionPath =>
                selectionPath[0].context.layoutItem && selectionPath[0].context.layoutItem.id === item.id);
        },
        bypassSelection($event) {
            if (this.dragInProgress) {
                if ($event) {
                    $event.stopImmediatePropagation();
                }

                this.dragInProgress = false;

                return;
            }
        },
        endLineResize(item, updates) {
            this.dragInProgress = true;
            let index = this.layoutItems.indexOf(item);
            Object.assign(item, updates);
            this.mutate(`configuration.items[${index}]`, item);
        },
        endResize(scaleWidth, scaleHeight, marqueeStart, marqueeOffset) {
            this.dragInProgress = true;
            this.layoutItems.forEach(item => {
                if (this.itemIsInCurrentSelection(item)) {
                    let itemXInMarqueeSpace = item.x - marqueeStart.x;
                    let itemXInMarqueeSpaceAfterScale = Math.round(itemXInMarqueeSpace * scaleWidth);
                    item.x = itemXInMarqueeSpaceAfterScale + marqueeOffset.x + marqueeStart.x;

                    let itemYInMarqueeSpace = item.y - marqueeStart.y;
                    let itemYInMarqueeSpaceAfterScale = Math.round(itemYInMarqueeSpace * scaleHeight);
                    item.y = itemYInMarqueeSpaceAfterScale + marqueeOffset.y + marqueeStart.y;

                    if (item.x2) {
                        let itemX2InMarqueeSpace = item.x2 - marqueeStart.x;
                        let itemX2InMarqueeSpaceAfterScale = Math.round(itemX2InMarqueeSpace * scaleWidth);
                        item.x2 = itemX2InMarqueeSpaceAfterScale + marqueeOffset.x + marqueeStart.x;
                    } else {
                        item.width = Math.round(item.width * scaleWidth);
                    }

                    if (item.y2) {
                        let itemY2InMarqueeSpace = item.y2 - marqueeStart.y;
                        let itemY2InMarqueeSpaceAfterScale = Math.round(itemY2InMarqueeSpace * scaleHeight);
                        item.y2 = itemY2InMarqueeSpaceAfterScale + marqueeOffset.y + marqueeStart.y;
                    } else {
                        item.height = Math.round(item.height * scaleHeight);
                    }
                }
            });
            this.mutate("configuration.items", this.layoutItems);
        },
        move(gridDelta) {
            this.dragInProgress = true;

            if (!this.initialPositions) {
                this.initialPositions = {};
                _.cloneDeep(this.selectedLayoutItems).forEach(selectedItem => {
                    if (selectedItem.type === 'line-view') {
                        this.initialPositions[selectedItem.id] = [selectedItem.x, selectedItem.y, selectedItem.x2, selectedItem.y2];
                        this.startingMinX2 = this.startingMinX2 !== undefined ? Math.min(this.startingMinX2, selectedItem.x2) : selectedItem.x2;
                        this.startingMinY2 = this.startingMinY2 !== undefined ? Math.min(this.startingMinY2, selectedItem.y2) : selectedItem.y2;
                    } else {
                        this.initialPositions[selectedItem.id] = [selectedItem.x, selectedItem.y];
                    }

                    this.startingMinX = this.startingMinX !== undefined ? Math.min(this.startingMinX, selectedItem.x) : selectedItem.x;
                    this.startingMinY = this.startingMinY !== undefined ? Math.min(this.startingMinY, selectedItem.y) : selectedItem.y;
                });
            }

            this.layoutItems.forEach(item => {
                if (this.initialPositions[item.id]) {
                    this.updateItemPosition(item, gridDelta);
                }
            });
        },
        updateItemPosition(item, gridDelta) {
            let startingPosition = this.initialPositions[item.id];
            let [startingX, startingY, startingX2, startingY2] = startingPosition;

            if (this.startingMinX + gridDelta[0] >= 0) {
                if (item.x2 !== undefined) {
                    if (this.startingMinX2 + gridDelta[0] >= 0) {
                        item.x = startingX + gridDelta[0];
                    }
                } else {
                    item.x = startingX + gridDelta[0];
                }
            }

            if (this.startingMinY + gridDelta[1] >= 0) {
                if (item.y2 !== undefined) {
                    if (this.startingMinY2 + gridDelta[1] >= 0) {
                        item.y = startingY + gridDelta[1];
                    }
                } else {
                    item.y = startingY + gridDelta[1];
                }
            }

            if (item.x2 !== undefined && this.startingMinX2 + gridDelta[0] >= 0 && this.startingMinX + gridDelta[0] >= 0) {
                item.x2 = startingX2 + gridDelta[0];
            }

            if (item.y2 !== undefined && this.startingMinY2 + gridDelta[1] >= 0 && this.startingMinY + gridDelta[1] >= 0) {
                item.y2 = startingY2 + gridDelta[1];
            }
        },
        endMove() {
            this.mutate('configuration.items', this.layoutItems);
            this.initialPositions = undefined;
            this.startingMinX = undefined;
            this.startingMinY = undefined;
            this.startingMinX2 = undefined;
            this.startingMinY2 = undefined;
        },
        mutate(path, value) {
            this.openmct.objects.mutate(this.domainObject, path, value);
        },
        handleDrop($event) {
            if (!$event.dataTransfer.types.includes('openmct/domain-object-path')) {
                return;
            }

            $event.preventDefault();

            let domainObject = JSON.parse($event.dataTransfer.getData('openmct/domain-object-path'))[0];
            let elementRect = this.$el.getBoundingClientRect();
            let droppedObjectPosition = [
                Math.floor(($event.pageX - elementRect.left) / this.gridSize[0]),
                Math.floor(($event.pageY - elementRect.top) / this.gridSize[1])
            ];

            if (this.isTelemetry(domainObject)) {
                this.addItem('telemetry-view', domainObject, droppedObjectPosition);
            } else {
                let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);

                if (!this.objectViewMap[keyString]) {
                    this.addItem('subobject-view', domainObject, droppedObjectPosition);
                } else {
                    let prompt = this.openmct.overlays.dialog({
                        iconClass: 'alert',
                        message: "This item is already in layout and will not be added again.",
                        buttons: [
                            {
                                label: 'OK',
                                callback: function () {
                                    prompt.dismiss();
                                }
                            }
                        ]
                    });
                }
            }
        },
        containsObject(identifier) {
            return _.get(this.domainObject, 'composition')
                .some(childId => this.openmct.objects.areIdsEqual(childId, identifier));
        },
        handleDragOver($event) {
            if (this.domainObject.locked) {
                return;
            }

            // Get the ID of the dragged object
            let draggedKeyString = $event.dataTransfer.types
                .filter(type => type.startsWith(DRAG_OBJECT_TRANSFER_PREFIX))
                .map(type => type.substring(DRAG_OBJECT_TRANSFER_PREFIX.length))[0];

            // If the layout already contains the given object, then shortcut the default dragover behavior and
            // potentially allow drop. Display layouts allow drag drop of duplicate telemetry objects.
            if (this.containsObject(draggedKeyString)) {
                $event.preventDefault();
            }
        },
        isTelemetry(domainObject) {
            if (this.openmct.telemetry.isTelemetryObject(domainObject)
                    && !this.options.showAsView.includes(domainObject.type)) {
                return true;
            } else {
                return false;
            }
        },
        addItem(itemType, ...options) {
            let item = getItemDefinition(itemType, this.openmct, this.gridSize, ...options);
            item.type = itemType;
            item.id = uuid();
            this.trackItem(item);
            this.layoutItems.push(item);
            this.openmct.objects.mutate(this.domainObject, "configuration.items", this.layoutItems);
            this.initSelectIndex = this.layoutItems.length - 1;
        },
        trackItem(item) {
            if (!item.identifier) {
                return;
            }

            let keyString = this.openmct.objects.makeKeyString(item.identifier);

            if (item.type === "telemetry-view") {
                let count = this.telemetryViewMap[keyString] || 0;
                this.telemetryViewMap[keyString] = ++count;
            } else if (item.type === "subobject-view") {
                let count = this.objectViewMap[keyString] || 0;
                this.objectViewMap[keyString] = ++count;
            }
        },
        removeItem(selectedItems) {
            let indices = [];
            this.initSelectIndex = -1;
            selectedItems.forEach(selectedItem => {
                indices.push(selectedItem[0].context.index);
                this.untrackItem(selectedItem[0].context.layoutItem);
            });
            _.pullAt(this.layoutItems, indices);
            this.mutate("configuration.items", this.layoutItems);
            this.$el.click();
        },
        untrackItem(item) {
            if (!item.identifier) {
                return;
            }

            let keyString = this.openmct.objects.makeKeyString(item.identifier);
            let telemetryViewCount = this.telemetryViewMap[keyString];
            let objectViewCount = this.objectViewMap[keyString];

            if (item.type === 'telemetry-view') {
                telemetryViewCount = --this.telemetryViewMap[keyString];

                if (telemetryViewCount === 0) {
                    delete this.telemetryViewMap[keyString];
                }
            } else if (item.type === 'subobject-view') {
                objectViewCount = --this.objectViewMap[keyString];

                if (objectViewCount === 0) {
                    delete this.objectViewMap[keyString];
                }
            }

            if (!telemetryViewCount && !objectViewCount) {
                this.removeFromComposition(keyString);
            }
        },
        removeFromComposition(keyString) {
            let composition = _.get(this.domainObject, 'composition');
            composition = composition.filter(identifier => {
                return this.openmct.objects.makeKeyString(identifier) !== keyString;
            });
            this.mutate("composition", composition);
        },
        initializeItems() {
            this.telemetryViewMap = {};
            this.objectViewMap = {};
            this.layoutItems.forEach(this.trackItem);
        },
        isItemAlreadyTracked(child) {
            let found = false;
            let keyString = this.openmct.objects.makeKeyString(child.identifier);

            this.layoutItems.forEach(item => {
                if (item.identifier) {
                    let itemKeyString = this.openmct.objects.makeKeyString(item.identifier);

                    if (itemKeyString === keyString) {
                        found = true;

                        return;
                    }
                }
            });

            if (found) {
                return true;
            } else if (this.isTelemetry(child)) {
                return this.telemetryViewMap[keyString] && this.objectViewMap[keyString];
            } else {
                return this.objectViewMap[keyString];
            }
        },
        addChild(child) {
            if (this.isItemAlreadyTracked(child)) {
                return;
            }

            let type;

            if (this.isTelemetry(child)) {
                type = 'telemetry-view';
            } else {
                type = 'subobject-view';
            }

            this.addItem(type, child);
        },
        removeChild(identifier) {
            let keyString = this.openmct.objects.makeKeyString(identifier);

            if (this.objectViewMap[keyString]) {
                delete this.objectViewMap[keyString];
                this.removeFromConfiguration(keyString);
            } else if (this.telemetryViewMap[keyString]) {
                delete this.telemetryViewMap[keyString];
                this.removeFromConfiguration(keyString);
            }
        },
        removeFromConfiguration(keyString) {
            let layoutItems = this.layoutItems.filter(item => {
                if (!item.identifier) {
                    return true;
                } else {
                    return this.openmct.objects.makeKeyString(item.identifier) !== keyString;
                }
            });
            this.mutate("configuration.items", layoutItems);
            this.$el.click();
        },
        orderItem(position, selectedItems) {
            let delta = ORDERS[position];
            let indices = [];
            let items = [];

            Object.assign(items, this.layoutItems);
            this.selectedLayoutItems.forEach(selectedItem => {
                indices.push(this.layoutItems.indexOf(selectedItem));
            });
            indices.sort((a, b) => a - b);

            if (position === 'top' || position === 'up') {
                indices.reverse();
            }

            if (position === 'top' || position === 'bottom') {
                this.moveToTopOrBottom(position, indices, items, delta);
            } else {
                this.moveUpOrDown(position, indices, items, delta);
            }

            this.mutate('configuration.items', this.layoutItems);
        },
        moveUpOrDown(position, indices, items, delta) {
            let previousItemIndex = -1;
            let newIndex = -1;

            indices.forEach((itemIndex, index) => {
                let isAdjacentItemSelected = position === 'up'
                    ? itemIndex + 1 === previousItemIndex
                    : itemIndex - 1 === previousItemIndex;

                if (index > 0 && isAdjacentItemSelected) {
                    if (position === 'up') {
                        newIndex -= 1;
                    } else {
                        newIndex += 1;
                    }
                } else {
                    newIndex = Math.max(Math.min(itemIndex + delta, this.layoutItems.length - 1), 0);
                }

                previousItemIndex = itemIndex;
                this.updateItemOrder(newIndex, itemIndex, items);
            });
        },
        moveToTopOrBottom(position, indices, items, delta) {
            let newIndex = -1;

            indices.forEach((itemIndex, index) => {
                if (index === 0) {
                    newIndex = Math.max(Math.min(itemIndex + delta, this.layoutItems.length - 1), 0);
                } else {
                    if (position === 'top') {
                        newIndex -= 1;
                    } else {
                        newIndex += 1;
                    }
                }

                this.updateItemOrder(newIndex, itemIndex, items);
            });
        },
        updateItemOrder(newIndex, itemIndex, items) {
            if (newIndex !== itemIndex) {
                this.layoutItems.splice(itemIndex, 1);
                this.layoutItems.splice(newIndex, 0, items[itemIndex]);
            }
        },
        updateTelemetryFormat(item, format) {
            let index = this.layoutItems.findIndex((layoutItem) => {
                return layoutItem.id === item.id;
            });

            item.format = format;
            this.mutate(`configuration.items[${index}]`, item);
        },
        createNewDomainObject(domainObject, composition, viewType, nameExtension, model) {
            let identifier = {
                key: uuid(),
                namespace: this.domainObject.identifier.namespace
            };
            let type = this.openmct.types.get(viewType);
            let parentKeyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let objectName = nameExtension ? `${domainObject.name}-${nameExtension}` : domainObject.name;
            let object = {};

            if (model) {
                object = _.cloneDeep(model);
            } else {
                object.type = viewType;
                type.definition.initialize(object);
                object.composition.push(...composition);
            }

            if (object.modified || object.persisted) {
                object.modified = undefined;
                object.persisted = undefined;
                delete object.modified;
                delete object.persisted;
            }

            object.name = objectName;
            object.identifier = identifier;
            object.location = parentKeyString;

            let savedResolve;
            this.openmct.objects.save(object).then(() => {
                savedResolve(object);
            });

            return new Promise((resolve) => {
                savedResolve = resolve;
            });
        },
        convertToTelemetryView(identifier, position) {
            this.openmct.objects.get(identifier).then((domainObject) => {
                this.composition.add(domainObject);
                this.addItem('telemetry-view', domainObject, position);
            });
        },
        dispatchMultipleSelection(selectItemsArray) {
            let event = new MouseEvent('click', {
                bubbles: true,
                shiftKey: true,
                cancelable: true,
                view: window
            });

            selectItemsArray.forEach((id) => {
                let refId = `layout-item-${id}`;
                let component = this.$refs[refId] && this.$refs[refId][0];

                if (component) {
                    component.immediatelySelect = event;
                    component.$el.dispatchEvent(event);
                }
            });
        },
        duplicateItem(selectedItems) {
            let objectStyles = this.domainObject.configuration.objectStyles || {};
            let selectItemsArray = [];
            let newDomainObjectsArray = [];

            selectedItems.forEach(selectedItem => {
                let layoutItem = selectedItem[0].context.layoutItem;
                let domainObject = selectedItem[0].context.item;
                let layoutItemStyle = objectStyles[layoutItem.id];
                let copy = _.cloneDeep(layoutItem);

                copy.id = uuid();
                selectItemsArray.push(copy.id);

                let offsetKeys = ['x', 'y'];

                if (copy.type === 'line-view') {
                    offsetKeys = offsetKeys.concat(['x2', 'y2']);
                }

                if (copy.type === 'subobject-view') {
                    this.createNewDomainObject(domainObject, domainObject.composition, domainObject.type, 'duplicate', domainObject).then((newDomainObject) => {
                        newDomainObjectsArray.push(newDomainObject);
                        copy.identifier = newDomainObject.identifier;
                    });
                }

                offsetKeys.forEach(key => {
                    copy[key] += DUPLICATE_OFFSET;
                });

                if (layoutItemStyle) {
                    objectStyles[copy.id] = layoutItemStyle;
                }

                this.trackItem(copy);
                this.layoutItems.push(copy);
            });

            this.$nextTick(() => {
                this.openmct.objects.mutate(this.domainObject, "configuration.items", this.layoutItems);
                this.openmct.objects.mutate(this.domainObject, "configuration.objectStyles", objectStyles);
                this.$el.click(); //clear selection;

                newDomainObjectsArray.forEach(domainObject => {
                    this.composition.add(domainObject);
                });
                this.dispatchMultipleSelection(selectItemsArray);
            });
        },
        mergeMultipleTelemetryViews(selection, viewType) {
            let identifiers = selection.map(selectedItem => {
                return selectedItem[0].context.layoutItem.identifier;
            });
            let firstDomainObject = selection[0][0].context.item;
            let firstLayoutItem = selection[0][0].context.layoutItem;
            let position = [firstLayoutItem.x, firstLayoutItem.y];
            let mockDomainObject = {
                name: 'Merged Telemetry Views',
                identifier: firstDomainObject.identifier
            };
            this.createNewDomainObject(mockDomainObject, identifiers, viewType).then((newDomainObject) => {
                this.composition.add(newDomainObject);
                this.addItem('subobject-view', newDomainObject, position);
                this.removeItem(selection);
                this.initSelectIndex = this.layoutItems.length - 1;
            });
        },
        mergeMultipleOverlayPlots(selection, viewType) {
            let overlayPlots = selection.map(selectedItem => selectedItem[0].context.item);
            let overlayPlotIdentifiers = overlayPlots.map(overlayPlot => overlayPlot.identifier);
            let firstOverlayPlot = overlayPlots[0];
            let firstLayoutItem = selection[0][0].context.layoutItem;
            let position = [firstLayoutItem.x, firstLayoutItem.y];
            let mockDomainObject = {
                name: 'Merged Overlay Plots',
                identifier: firstOverlayPlot.identifier
            };
            this.createNewDomainObject(mockDomainObject, overlayPlotIdentifiers, viewType).then((newDomainObject) => {
                let newDomainObjectKeyString = this.openmct.objects.makeKeyString(newDomainObject.identifier);
                let domainObjectKeyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

                this.composition.add(newDomainObject);
                this.addItem('subobject-view', newDomainObject, position);

                overlayPlots.forEach(overlayPlot => {
                    if (overlayPlot.location === domainObjectKeyString) {
                        this.openmct.objects.mutate(overlayPlot, 'location', newDomainObjectKeyString);
                    }
                });

                this.removeItem(selection);
                this.initSelectIndex = this.layoutItems.length - 1;
            });
        },
        getTelemetryIdentifiers(domainObject) {
            let method = TELEMETRY_IDENTIFIER_FUNCTIONS[domainObject.type];

            if (method) {
                return method(domainObject, this.openmct);
            } else {
                throw 'No method identified for domainObject type';
            }
        },
        switchViewType(context, viewType, selection) {
            let domainObject = context.item;
            let layoutItem = context.layoutItem;
            let position = [layoutItem.x, layoutItem.y];
            let layoutType = 'subobject-view';

            if (layoutItem.type === 'telemetry-view') {
                this.createNewDomainObject(domainObject, [domainObject.identifier], viewType).then((newDomainObject) => {
                    this.composition.add(newDomainObject);
                    this.addItem(layoutType, newDomainObject, position);
                });
            } else {
                this.getTelemetryIdentifiers(domainObject).then((identifiers) => {
                    if (viewType === 'telemetry-view') {
                        identifiers.forEach((identifier, index) => {
                            let positionX = position[0] + (index * DUPLICATE_OFFSET);
                            let positionY = position[1] + (index * DUPLICATE_OFFSET);

                            this.convertToTelemetryView(identifier, [positionX, positionY]);
                        });
                    } else {
                        this.createNewDomainObject(domainObject, identifiers, viewType).then((newDomainObject) => {
                            this.composition.add(newDomainObject);
                            this.addItem(layoutType, newDomainObject, position);
                        });
                    }
                });
            }

            this.removeItem(selection);
            this.initSelectIndex = this.layoutItems.length - 1; //restore selection
        },
        toggleGrid() {
            this.showGrid = !this.showGrid;
        }
    }
};
</script>
