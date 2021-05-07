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
     class="js-plot-options-browse"
>
    <ul class="c-tree">
        <h2 title="Plot series display properties in this object">Plot Series</h2>
        <plot-options-item v-for="series in plotSeries"
                           :key="series.key"
                           :series="series"
        />
    </ul>
    <div class="grid-properties">
        <ul class="l-inspector-part">
            <h2 title="Y axis settings for this object">Y Axis</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Manually override how the Y axis is labeled."
                >Label</div>
                <div class="grid-cell value">{{ label ? label : "Not defined" }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Automatically scale the Y axis to keep all values in view."
                >Autoscale</div>
                <div class="grid-cell value">
                    {{ autoscale ? "Enabled: " : "Disabled" }}
                    {{ autoscale ? autoscalePadding : "" }}
                </div>
            </li>
            <li v-if="!autoscale && rangeMin"
                class="grid-row"
            >
                <div class="grid-cell label"
                     title="Minimum Y axis value."
                >Minimum value</div>
                <div class="grid-cell value">{{ rangeMin }}</div>
            </li>
            <li v-if="!autoscale && rangeMax"
                class="grid-row"
            >
                <div class="grid-cell label"
                     title="Maximum Y axis value."
                >Maximum value</div>
                <div class="grid-cell value">{{ rangeMax }}</div>
            </li>
        </ul>
        <ul class="l-inspector-part">
            <h2 title="Legend settings for this object">Legend</h2>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="The position of the legend relative to the plot display area."
                >Position</div>
                <div class="grid-cell value capitalize">{{ position }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Hide the legend when the plot is small"
                >Hide when plot small</div>
                <div class="grid-cell value">{{ hideLegendWhenSmall ? "Yes" : "No" }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Show the legend expanded by default"
                >Expand by Default</div>
                <div class="grid-cell value">{{ expandByDefault ? "Yes" : "No" }}</div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="What to display in the legend when it's collapsed."
                >Show when collapsed:</div>
                <div class="grid-cell value">{{
                    valueToShowWhenCollapsed.replace('nearest', '')
                }}
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="What to display in the legend when it's expanded."
                >Show when expanded:</div>
                <div class="grid-cell value comma-list">
                    <span v-if="showTimestampWhenExpanded">Timestamp</span>
                    <span v-if="showValueWhenExpanded">Value</span>
                    <span v-if="showMinimumWhenExpanded">Min</span>
                    <span v-if="showMaximumWhenExpanded">Max</span>
                    <span v-if="showUnitsWhenExpanded">Units</span>
                </div>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import PlotOptionsItem from "./PlotOptionsItem.vue";
import configStore from "../single/configuration/configStore";
import eventHelpers from "../single/lib/eventHelpers";

export default {
    components: {
        PlotOptionsItem
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            config: undefined,
            label: '',
            autoscale: '',
            autoscalePadding: '',
            rangeMin: '',
            rangeMax: '',
            position: '',
            hideLegendWhenSmall: '',
            expandByDefault: '',
            valueToShowWhenCollapsed: '',
            showTimestampWhenExpanded: '',
            showValueWhenExpanded: '',
            showMinimumWhenExpanded: '',
            showMaximumWhenExpanded: '',
            showUnitsWhenExpanded: '',
            loaded: false,
            plotSeries: []
        };
    },
    mounted() {
        eventHelpers.extend(this);
        this.config = this.getConfig();
        this.initConfiguration();
        this.registerListeners();
        this.loaded = true;
    },
    beforeDestroy() {
        this.stopListening();
    },
    methods: {
        initConfiguration() {
            this.label = this.config.yAxis.get('label');
            this.autoscale = this.config.yAxis.get('autoscale');
            this.autoscalePadding = this.config.yAxis.get('autoscalePadding');
            const range = this.config.yAxis.get('range');
            if (range) {
                this.rangeMin = range.min;
                this.rangeMax = range.max;
            }

            this.position = this.config.legend.get('position');
            this.hideLegendWhenSmall = this.config.legend.get('hideLegendWhenSmall');
            this.expandByDefault = this.config.legend.get('expandByDefault');
            this.valueToShowWhenCollapsed = this.config.legend.get('valueToShowWhenCollapsed');
            this.showTimestampWhenExpanded = this.config.legend.get('showTimestampWhenExpanded');
            this.showValueWhenExpanded = this.config.legend.get('showValueWhenExpanded');
            this.showMinimumWhenExpanded = this.config.legend.get('showMinimumWhenExpanded');
            this.showMaximumWhenExpanded = this.config.legend.get('showMaximumWhenExpanded');
            this.showUnitsWhenExpanded = this.config.legend.get('showUnitsWhenExpanded');
        },
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
