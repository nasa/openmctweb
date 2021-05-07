<!--
 Open MCT, Copyright (c) 2014-2020, United States Government
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
<div v-if="config && loaded"
     class="js-plot-options-edit"
>
    <ul class="c-tree">
        <h2 title="Display properties for this object">Plot Series</h2>
        <li v-for="series in plotSeries"
            :key="series.key"
        >
            <series-form :series="series" />
        </li>
    </ul>
    <y-axis-form v-show="!!plotSeries.length"
                 class="grid-properties"
                 :y-axis="config.yAxis"
    />
    <ul class="l-inspector-part">
        <h2 title="Legend options">Legend</h2>
        <legend-form v-show="!!plotSeries.length"
                     class="grid-properties"
                     :legend="config.legend"
        />
    </ul>
</div>
</template>
<script>
import SeriesForm from "@/plugins/plot/vue/inspector/forms/SeriesForm.vue";
import YAxisForm from "@/plugins/plot/vue/inspector/forms/YAxisForm.vue";
import LegendForm from "@/plugins/plot/vue/inspector/forms/LegendForm.vue";
import eventHelpers from "@/plugins/plot/vue/single/lib/eventHelpers";
import configStore from "@/plugins/plot/vue/single/configuration/configStore";

export default {
    components: {
        LegendForm,
        SeriesForm,
        YAxisForm
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            config: {},
            plotSeries: [],
            loaded: false
        };
    },
    mounted() {
        eventHelpers.extend(this);
        this.config = this.getConfig();
        this.registerListeners();
        this.loaded = true;
    },
    beforeDestroy() {
        this.stopListening();
    },
    methods: {
        getConfig() {
            this.configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            return configStore.get(this.configId);
        },
        registerListeners() {
            this.config.series.forEach(this.addSeries, this);

            this.listenTo(this.config.series, 'add', this.addSeries, this);
            this.listenTo(this.config.series, 'remove', this.resetAllSeries, this);
        },

        addSeries(series, index) {
            this.plotSeries[index] = series;
        },

        resetAllSeries() {
            this.plotSeries = [];
            this.config.series.forEach(this.addSeries, this);
        }
    }
};
</script>
