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
<div class="c-plot c-plot--stacked holder holder-plot has-control-bar">
    <div v-show="!hideExportButtons && !options.compact"
         class="c-control-bar"
    >
        <span class="c-button-set c-button-set--strip-h">
            <button class="c-button icon-download"
                    title="Export This View's Data as PNG"
                    @click="exportPNG()"
            >
                <span class="c-button__label">PNG</span>
            </button>
            <button class="c-button"
                    title="Export This View's Data as JPG"
                    @click="exportJPG()"
            >
                <span class="c-button__label">JPG</span>
            </button>
        </span>
        <button class="c-button icon-crosshair"
                :class="{ 'is-active': cursorGuide }"
                title="Toggle cursor guides"
                @click="toggleCursorGuide"
        >
        </button>
        <button class="c-button"
                :class="{ 'icon-grid-on': gridLines, 'icon-grid-off': !gridLines }"
                title="Toggle grid lines"
                @click="toggleGridLines"
        >
        </button>
    </div>
    <stacked-plot-item v-for="object in compositionObjects"
                       :key="object.id"
                       class="c-plot--stacked-container"
                       :object="object"
                       :options="options"
                       :grid-lines="gridLines"
                       :cursor-guide="cursorGuide"
                       :plot-tick-width="maxTickWidth"
                       @plotTickWidth="onTickWidthChange"
                       @loadingUpdated="loadingUpdated"
    />
</div>
</template>

<script>
import eventHelpers from "@/plugins/plot/vue/single/lib/eventHelpers";
import StackedPlotItem from "@/plugins/plot/vue/stackedPlot/StackedPlotItem.vue";

export default {
    components: {
        StackedPlotItem
    },
    inject: ['openmct', 'domainObject', 'composition'],
    props: {
        options: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            hideExportButtons: false,
            cursorGuide: false,
            gridLines: true,
            loading: false,
            compositionObjects: []
        };
    },
    computed: {
        maxTickWidth() {
            return Math.max(...Object.values(this.tickWidthMap));
        }
    },
    beforeDestroy() {
        this.destroy();
    },
    mounted() {
        eventHelpers.extend(this);

        this.exportImageService = this.openmct.$injector.get('exportImageService');

        this.tickWidthMap = {};

        this.composition.on('add', this.addChild);
        this.composition.on('remove', this.removeChild);
        this.composition.on('reorder', this.compositionReorder);
        this.composition.load();
    },
    methods: {
        loadingUpdated(loaded) {
            this.loading = loaded;
        },
        destroy() {
            this.stopListening();
            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            this.composition.off('reorder', this.compositionReorder);
        },

        addChild(child) {
            const id = this.openmct.objects.makeKeyString(child.identifier);

            this.tickWidthMap[id] = 0;
            this.compositionObjects.push(child);
        },

        removeChild(childIdentifier) {
            const id = this.openmct.objects.makeKeyString(childIdentifier);
            delete this.tickWidthMap[id];
            const childObj = this.compositionObjects.filter((c) => {
                const identifier = this.openmct.objects.makeKeyString(c.identifier);

                return identifier === id;
            })[0];
            if (childObj) {
                const index = this.compositionObjects.indexOf(childObj);
                this.compositionObjects.splice(index, 1);
            }
        },

        compositionReorder(reorderPlan) {
            let oldComposition = this.compositionObjects.slice();

            reorderPlan.forEach((reorder) => {
                this.compositionObjects[reorder.newIndex] = oldComposition[reorder.oldIndex];
            });
        },

        resetTelemetryAndTicks(domainObject) {
            this.compositionObjects = [];
            this.tickWidthMap = {};
        },

        exportJPG() {
            this.hideExportButtons = true;
            const plotElement = this.$refs.plotContainer;

            this.exportImageService.exportJPG(plotElement, 'stacked-plot.jpg', 'export-plot')
                .finally(function () {
                    this.hideExportButtons = false;
                }.bind(this));
        },

        exportPNG() {
            this.hideExportButtons = true;

            const plotElement = this.$refs.plotContainer;

            this.exportImageService.exportPNG(plotElement, 'stacked-plot.png', 'export-plot')
                .finally(function () {
                    this.hideExportButtons = false;
                }.bind(this));
        },

        toggleCursorGuide() {
            this.cursorGuide = !this.cursorGuide;
        },

        toggleGridLines() {
            this.gridLines = !this.gridLines;
        },
        onTickWidthChange(width, plotId) {
            if (!Object.prototype.hasOwnProperty.call(this.tickWidthMap, plotId)) {
                return;
            }

            //update the tickWidth for this plotId, the computed max tick width of the stacked plot will be cascaded down
            //TODO: Might need to do this using $set
            this.tickWidthMap[plotId] = Math.max(width, this.tickWidthMap[plotId]);
            // const newTickWidth = Math.max(...Object.values(this.tickWidthMap));
            // if (newTickWidth !== tickWidth || width !== tickWidth) {
            //     tickWidth = newTickWidth;
            //     $scope.$broadcast('plot:tickWidth', tickWidth);
            // }
        }
    }
};
</script>
