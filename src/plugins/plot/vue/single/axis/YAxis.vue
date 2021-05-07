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
     class="gl-plot-axis-area gl-plot-y has-local-controls"
     :style="{
         width: (tickWidth + 20) + 'px'
     }"
>

    <div v-if="singleSeries"
         class="gl-plot-label gl-plot-y-label"
         :class="{'icon-gear': (yKeyOptions.length > 1)}"
    >{{ yAxisLabel }}
    </div>

    <select v-if="yKeyOptions.length > 1 && singleSeries"
            v-model="yAxisLabel"
            class="gl-plot-y-label__select local-controls--hidden"
            @change="toggleYAxisLabel"
    >
        <option v-for="(option, index) in yKeyOptions"
                :key="index"
                :value="option.name"
                :selected="option.name === yAxisLabel"
        >
            {{ option.name }}
        </option>
    </select>

    <mct-ticks :axis-type="'yAxis'"
               class="gl-plot-ticks"
               :position="'top'"
               @plotTickWidth="onTickWidthChange"
    />
</div>
</template>

<script>
import MctTicks from "../MctTicks.vue";
import configStore from "../configuration/configStore";

export default {
    components: {
        MctTicks
    },
    inject: ['openmct', 'domainObject'],
    props: {
        singleSeries: {
            type: Boolean,
            default() {
                return true;
            }
        },
        seriesModel: {
            type: Object,
            default() {
                return {};
            }
        },
        tickWidth: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    data() {
        return {
            yAxisLabel: 'none',
            loaded: false
        };
    },
    mounted() {
        this.yAxis = this.getYAxisFromConfig();
        this.loaded = true;
        this.setUpYAxisOptions();
    },
    methods: {
        getYAxisFromConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (config) {
                return config.yAxis;
            }
        },
        setUpYAxisOptions() {
            this.yKeyOptions = this.seriesModel.metadata
                .valuesForHints(['range'])
                .map(function (o) {
                    return {
                        name: o.name,
                        key: o.key
                    };
                });

            //  set yAxisLabel if none is set yet
            if (this.yAxisLabel === 'none') {
                let yKey = this.seriesModel.model.yKey;
                let yKeyModel = this.yKeyOptions.filter(o => o.key === yKey)[0];

                this.yAxisLabel = yKeyModel.name;
            }
        },
        toggleYAxisLabel() {
            let yAxisObject = this.yKeyOptions.filter(o => o.name === this.yAxisLabel)[0];

            if (yAxisObject) {
                this.$emit('yKeyChanged', yAxisObject.key);
                this.yAxis.set('label', this.yAxisLabel);
            }
        },
        onTickWidthChange(width) {
            this.$emit('tickWidthChanged', width);
        }
    }
};
</script>
