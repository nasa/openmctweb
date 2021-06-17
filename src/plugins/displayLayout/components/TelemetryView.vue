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
<layout-frame
    :item="item"
    :grid-size="gridSize"
    :is-editing="isEditing"
    @move="(gridDelta) => $emit('move', gridDelta)"
    @endMove="() => $emit('endMove')"
>
    <div
        v-if="domainObject"
        class="c-telemetry-view u-style-receiver"
        :class="[statusClass]"
        :style="styleObject"
        :data-font-size="item.fontSize"
        :data-font="item.font"
        @contextmenu.prevent="showContextMenu"
    >
        <div class="is-status__indicator"
             :title="`This item is ${status}`"
        ></div>
        <div
            v-if="showLabel"
            class="c-telemetry-view__label"
        >
            <div class="c-telemetry-view__label-text">
                {{ domainObject.name }}
            </div>
        </div>

        <div
            v-if="showValue"
            :title="fieldName"
            class="c-telemetry-view__value"
            :class="[telemetryClass]"
        >
            <div class="c-telemetry-view__value-text">
                {{ telemetryValue }}
                <span
                    v-if="unit && item.showUnits"
                    class="c-telemetry-view__value-text__unit"
                >
                    {{ unit }}
                </span>
            </div>
        </div>
    </div>
</layout-frame>
</template>

<script>
import LayoutFrame from './LayoutFrame.vue';
import conditionalStylesMixin from "../mixins/objectStyles-mixin";
import { getDefaultNotebook } from '@/plugins/notebook/utils/notebook-storage.js';

const DEFAULT_TELEMETRY_DIMENSIONS = [10, 5];
const DEFAULT_POSITION = [1, 1];
const CONTEXT_MENU_ACTIONS = ['copyToClipboard', 'copyToNotebook', 'viewHistoricalData'];

export default {
    makeDefinition(openmct, gridSize, domainObject, position) {
        let metadata = openmct.telemetry.getMetadata(domainObject);
        position = position || DEFAULT_POSITION;

        return {
            identifier: domainObject.identifier,
            x: position[0],
            y: position[1],
            width: DEFAULT_TELEMETRY_DIMENSIONS[0],
            height: DEFAULT_TELEMETRY_DIMENSIONS[1],
            displayMode: 'all',
            value: metadata.getDefaultDisplayValue(),
            stroke: "",
            fill: "",
            color: "",
            fontSize: 'default',
            font: 'default'
        };
    },
    components: {
        LayoutFrame
    },
    mixins: [conditionalStylesMixin],
    inject: ['openmct', 'objectPath', 'currentView'],
    props: {
        item: {
            type: Object,
            required: true
        },
        gridSize: {
            type: Array,
            required: true,
            validator: (arr) => arr && arr.length === 2
                && arr.every(el => typeof el === 'number')
        },
        initSelect: Boolean,
        index: {
            type: Number,
            required: true
        },
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            currentObjectPath: undefined,
            datum: undefined,
            domainObject: undefined,
            formats: undefined,
            viewKey: `alphanumeric-format-${Math.random()}`,
            status: '',
            mutablePromise: undefined
        };
    },
    computed: {
        statusClass() {
            return (this.status) ? `is-status--${this.status}` : '';
        },
        showLabel() {
            let displayMode = this.item.displayMode;

            return displayMode === 'all' || displayMode === 'label';
        },
        showValue() {
            let displayMode = this.item.displayMode;

            return displayMode === 'all' || displayMode === 'value';
        },
        unit() {
            let value = this.item.value;
            let unit = this.metadata.value(value).unit;

            return unit;
        },
        styleObject() {
            let size;
            //for legacy size support
            if (!this.item.fontSize) {
                size = this.item.size;
            }

            return Object.assign({}, {
                size
            }, this.itemStyle);
        },
        fieldName() {
            return this.valueMetadata && this.valueMetadata.name;
        },
        valueMetadata() {
            return this.datum && this.metadata.value(this.item.value);
        },
        formatter() {
            if (this.item.format) {
                return this.customStringformatter;
            }

            return this.formats[this.item.value];
        },
        telemetryValue() {
            if (!this.datum) {
                return;
            }

            return this.formatter && this.formatter.format(this.datum);
        },
        telemetryClass() {
            if (!this.datum) {
                return;
            }

            let alarm = this.limitEvaluator && this.limitEvaluator.evaluate(this.datum, this.valueMetadata);

            return alarm && alarm.cssClass;
        }
    },
    watch: {
        index(newIndex) {
            if (!this.context) {
                return;
            }

            this.context.index = newIndex;
        },
        item(newItem) {
            if (!this.context) {
                return;
            }

            this.context.layoutItem = newItem;
        }
    },
    mounted() {
        if (this.openmct.objects.supportsMutation(this.item.identifier)) {
            this.mutablePromise = this.openmct.objects.getMutable(this.item.identifier)
                .then(this.setObject);
        } else {
            this.openmct.objects.get(this.item.identifier)
                .then(this.setObject);
        }

        this.openmct.time.on("bounds", this.refreshData);

        this.status = this.openmct.status.get(this.item.identifier);
        this.removeStatusListener = this.openmct.status.observe(this.item.identifier, this.setStatus);
    },
    beforeDestroy() {
        this.removeSubscription();
        this.removeStatusListener();

        if (this.removeSelectable) {
            this.removeSelectable();
        }

        this.openmct.time.off("bounds", this.refreshData);

        if (this.mutablePromise) {
            this.mutablePromise.then(() => {
                this.openmct.objects.destroyMutable(this.domainObject);
            });
        } else if (this.domainObject.isMutable) {
            this.openmct.objects.destroyMutable(this.domainObject);
        }
    },
    methods: {
        formattedValueForCopy() {
            const timeFormatterKey = this.openmct.time.timeSystem().key;
            const timeFormatter = this.formats[timeFormatterKey];
            const unit = this.unit ? ` ${this.unit}` : '';

            return `At ${timeFormatter.format(this.datum)} ${this.domainObject.name} had a value of ${this.telemetryValue}${unit}`;
        },
        requestHistoricalData() {
            let bounds = this.openmct.time.bounds();
            let options = {
                start: bounds.start,
                end: bounds.end,
                size: 1,
                strategy: 'latest'
            };
            this.openmct.telemetry.request(this.domainObject, options)
                .then(data => {
                    if (data.length > 0) {
                        this.updateView(data[data.length - 1]);
                    }
                });
        },
        subscribeToObject() {
            this.subscription = this.openmct.telemetry.subscribe(this.domainObject, function (datum) {
                const key = this.openmct.time.timeSystem().key;
                const datumTimeStamp = datum[key];
                if (this.openmct.time.clock() !== undefined
                    || (datumTimeStamp
                        && (this.openmct.time.bounds().end >= datumTimeStamp))
                ) {
                    this.updateView(datum);
                }
            }.bind(this));
        },
        updateView(datum) {
            this.datum = datum;
        },
        removeSubscription() {
            if (this.subscription) {
                this.subscription();
                this.subscription = undefined;
            }
        },
        refreshData(bounds, isTick) {
            if (!isTick) {
                this.datum = undefined;
                this.requestHistoricalData(this.domainObject);
            }
        },
        setObject(domainObject) {
            this.domainObject = domainObject;
            this.mutablePromise = undefined;
            this.keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
            this.limitEvaluator = this.openmct.telemetry.limitEvaluator(this.domainObject);
            this.formats = this.openmct.telemetry.getFormatMap(this.metadata);

            const valueMetadata = this.metadata.value(this.item.value);
            this.customStringformatter = this.openmct.telemetry.customStringFormatter(valueMetadata, this.item.format);

            this.requestHistoricalData();
            this.subscribeToObject();

            this.currentObjectPath = this.objectPath.slice();
            this.currentObjectPath.unshift(this.domainObject);

            this.context = {
                item: domainObject,
                layoutItem: this.item,
                index: this.index,
                updateTelemetryFormat: this.updateTelemetryFormat,
                toggleUnits: this.toggleUnits,
                showUnits: this.showUnits
            };
            this.removeSelectable = this.openmct.selection.selectable(
                this.$el, this.context, this.immediatelySelect || this.initSelect);
            delete this.immediatelySelect;
        },
        updateTelemetryFormat(format) {
            this.customStringformatter.setFormat(format);

            this.$emit('formatChanged', this.item, format);
        },
        updateViewContext() {
            this.$emit('contextClick', {
                viewHistoricalData: true,
                formattedValueForCopy: this.formattedValueForCopy
            });
        },
        async getContextMenuActions() {
            const defaultNotebook = getDefaultNotebook();
            const domainObject = defaultNotebook && await this.openmct.objects.get(defaultNotebook.notebookMeta.identifier);
            const actionCollection = this.openmct.actions.get(this.currentObjectPath, this.currentView);
            const actionsObject = actionCollection.getActionsObject();

            let copyToNotebookAction = actionsObject.copyToNotebook;

            if (defaultNotebook) {
                const defaultPath = domainObject && `${domainObject.name} - ${defaultNotebook.section.name} - ${defaultNotebook.page.name}`;
                copyToNotebookAction.name = `Copy to Notebook ${defaultPath}`;
            } else {
                actionsObject.copyToNotebook = undefined;
                delete actionsObject.copyToNotebook;
            }

            return CONTEXT_MENU_ACTIONS.map(actionKey => {
                return actionsObject[actionKey];
            }).filter(action => action !== undefined);
        },
        async showContextMenu(event) {
            this.updateViewContext();
            const contextMenuActions = await this.getContextMenuActions();

            this.openmct.menus.showMenu(event.x, event.y, contextMenuActions);
        },
        setStatus(status) {
            this.status = status;
        }
    }
};

</script>
