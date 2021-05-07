
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
<tr
    class="js-lad-table__body__row"
    @contextmenu.prevent="showContextMenu"
>
    <td class="js-first-data">{{ domainObject.name }}</td>
    <td class="js-second-data">{{ formattedTimestamp }}</td>
    <td
        class="js-third-data"
        :class="valueClass"
    >{{ value }}</td>
    <td
        v-if="hasUnits"
        class="js-units"
    >
        {{ unit }}
    </td>
</tr>
</template>

<script>

const CONTEXT_MENU_ACTIONS = [
    'viewDatumAction',
    'viewHistoricalData',
    'remove'
];

export default {
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
        hasUnits: {
            type: Boolean,
            requred: true
        }
    },
    data() {
        let currentObjectPath = this.objectPath.slice();
        currentObjectPath.unshift(this.domainObject);

        return {
            timestamp: undefined,
            value: '---',
            valueClass: '',
            currentObjectPath,
            unit: ''
        };
    },
    computed: {
        formattedTimestamp() {
            return this.timestamp !== undefined ? this.getFormattedTimestamp(this.timestamp) : '---';
        }
    },
    mounted() {
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.bounds = this.openmct.time.bounds();

        this.limitEvaluator = this.openmct
            .telemetry
            .limitEvaluator(this.domainObject);

        this.openmct.time.on('timeSystem', this.updateTimeSystem);
        this.openmct.time.on('bounds', this.updateBounds);

        this.timestampKey = this.openmct.time.timeSystem().key;

        this.valueMetadata = this
            .metadata
            .valuesForHints(['range'])[0];

        this.valueKey = this.valueMetadata.key;

        this.unsubscribe = this.openmct
            .telemetry
            .subscribe(this.domainObject, this.updateValues);

        this.requestHistory();

        if (this.hasUnits) {
            this.setUnit();
        }
    },
    destroyed() {
        this.unsubscribe();
        this.openmct.time.off('timeSystem', this.updateTimeSystem);
        this.openmct.time.off('bounds', this.updateBounds);
    },
    methods: {
        updateValues(datum) {
            let newTimestamp = this.getParsedTimestamp(datum);
            let limit;

            if (this.shouldUpdate(newTimestamp)) {
                this.datum = datum;
                this.timestamp = newTimestamp;
                this.value = this.formats[this.valueKey].format(datum);
                limit = this.limitEvaluator.evaluate(datum, this.valueMetadata);
                if (limit) {
                    this.valueClass = limit.cssClass;
                } else {
                    this.valueClass = '';
                }
            }
        },
        shouldUpdate(newTimestamp) {
            let newTimestampInBounds = this.inBounds(newTimestamp);
            let noExistingTimestamp = this.timestamp === undefined;
            let newTimestampIsLatest = newTimestamp > this.timestamp;

            return newTimestampInBounds
                && (noExistingTimestamp || newTimestampIsLatest);
        },
        requestHistory() {
            this.openmct
                .telemetry
                .request(this.domainObject, {
                    start: this.bounds.start,
                    end: this.bounds.end,
                    size: 1,
                    strategy: 'latest'
                })
                .then((array) => this.updateValues(array[array.length - 1]));
        },
        updateBounds(bounds, isTick) {
            this.bounds = bounds;
            if (!isTick) {
                this.resetValues();
                this.requestHistory();
            }
        },
        inBounds(timestamp) {
            return timestamp >= this.bounds.start && timestamp <= this.bounds.end;
        },
        updateTimeSystem(timeSystem) {
            this.resetValues();
            this.timestampKey = timeSystem.key;
        },
        getView() {
            return {
                getViewContext: () => {
                    return {
                        viewHistoricalData: true,
                        viewDatumAction: true,
                        getDatum: () => {
                            return this.datum;
                        }
                    };
                }
            };
        },
        showContextMenu(event) {
            let actionCollection = this.openmct.actions.get(this.currentObjectPath, this.getView());
            let allActions = actionCollection.getActionsObject();
            let applicableActions = CONTEXT_MENU_ACTIONS.map(key => allActions[key]);

            this.openmct.menus.showMenu(event.x, event.y, applicableActions);
        },
        resetValues() {
            this.value = '---';
            this.timestamp = undefined;
            this.valueClass = '';
        },
        getParsedTimestamp(timestamp) {
            if (this.timeSystemFormat()) {
                return this.formats[this.timestampKey].parse(timestamp);
            }
        },
        getFormattedTimestamp(timestamp) {
            if (this.timeSystemFormat()) {
                return this.formats[this.timestampKey].format(timestamp);
            }
        },
        timeSystemFormat() {
            if (this.formats[this.timestampKey]) {
                return true;
            } else {
                console.warn(`No formatter for ${this.timestampKey} time system for ${this.domainObject.name}.`);

                return false;
            }
        },
        setUnit() {
            this.unit = this.valueMetadata.unit || '';
        }
    }
};
</script>

