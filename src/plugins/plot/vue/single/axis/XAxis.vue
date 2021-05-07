<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
<div v-if="loaded"
     class="gl-plot-axis-area gl-plot-x has-local-controls"
>
    <mct-ticks :axis-type="'xAxis'"
               :position="'left'"
               @plotTickWidth="onTickWidthChange"
    />

    <div
        class="gl-plot-label gl-plot-x-label"
        :class="{'icon-gear': isEnabledXKeyToggle()}"
    >
        {{ xAxisLabel }}
    </div>

    <select
        v-show="isEnabledXKeyToggle()"
        v-model="selectedXKeyOptionKey"
        class="gl-plot-x-label__select local-controls--hidden"
        @change="toggleXKeyOption()"
    >
        <option v-for="option in xKeyOptions"
                :key="option.key"
                :value="option.key"
        >{{ option.name }}
        </option>
    </select>
</div>
</template>

<script>
import MctTicks from "../MctTicks.vue";
import eventHelpers from '../lib/eventHelpers';
import configStore from "../configuration/configStore";

export default {
    components: {
        MctTicks
    },
    inject: ['openmct', 'domainObject'],
    props: {
        seriesModel: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            selectedXKeyOptionKey: '',
            xKeyOptions: [],
            xAxis: {},
            loaded: false,
            xAxisLabel: ''
        };
    },
    mounted() {
        eventHelpers.extend(this);
        this.xAxis = this.getXAxisFromConfig();
        this.loaded = true;
        this.setUpXAxisOptions();
        this.openmct.time.on('timeSystem', this.syncXAxisToTimeSystem);
        this.listenTo(this.xAxis, 'change', this.setUpXAxisOptions);
    },
    beforeDestroy() {
        this.openmct.time.off('timeSystem', this.syncXAxisToTimeSystem);
    },
    methods: {
        isEnabledXKeyToggle() {
            const isSinglePlot = this.xKeyOptions && this.xKeyOptions.length > 1 && this.seriesModel;
            const isFrozen = this.xAxis.get('frozen');
            const inRealTimeMode = this.openmct.time.clock();

            return isSinglePlot && !isFrozen && !inRealTimeMode;
        },
        getXAxisFromConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (config) {
                return config.xAxis;
            }
        },
        toggleXKeyOption() {
            const selectedXKey = this.selectedXKeyOptionKey;
            const dataForSelectedXKey = this.seriesModel.data
                ? this.seriesModel.data[0][selectedXKey]
                : undefined;

            if (dataForSelectedXKey !== undefined) {
                this.xAxis.set('key', selectedXKey);
            } else {
                this.openmct.notifications.error('Cannot change x-axis view as no data exists for this view type.');
                const xAxisKey = this.xAxis.get('key');
                this.selectedXKeyOptionKey = this.getXKeyOption(xAxisKey).key;
            }
        },
        getXKeyOption(key) {
            return this.xKeyOptions.find(option => option.key === key);
        },
        syncXAxisToTimeSystem(timeSystem) {
            const xAxisKey = this.xAxis.get('key');
            if (xAxisKey !== timeSystem.key) {
                this.xAxis.set('key', timeSystem.key);
                this.xAxis.resetSeries();
                this.setUpXAxisOptions();
            }
        },
        setUpXAxisOptions() {
            const xAxisKey = this.xAxis.get('key');

            this.xKeyOptions = this.seriesModel.metadata
                .valuesForHints(['domain'])
                .map(function (o) {
                    return {
                        name: o.name,
                        key: o.key
                    };
                });
            this.xAxisLabel = this.xAxis.get('label');
            this.selectedXKeyOptionKey = this.getXKeyOption(xAxisKey).key;
        },
        onTickWidthChange(width) {
            this.$emit('tickWidthChanged', width);
        }
    }
};
</script>
