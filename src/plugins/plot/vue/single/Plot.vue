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
<div ref="plotWrapper"
     class="c-plot holder holder-plot has-control-bar"
>
    <div v-if="!options.compact"
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

    <div ref="plotContainer"
         class="l-view-section u-style-receiver js-style-receiver"
    >
        <div v-show="!!loading"
             class="c-loading--overlay loading"
        ></div>
        <mct-plot :grid-lines="gridLines"
                  :cursor-guide="cursorGuide"
                  :options="options"
                  @loadingUpdated="loadingUpdated"
        />
    </div>
</div>
</template>

<script>
import eventHelpers from "./lib/eventHelpers";
import MctPlot from './MctPlot.vue';

export default {
    components: {
        MctPlot
    },
    inject: ['openmct', 'domainObject'],
    props: {
        options: {
            type: Object,
            default() {
                return {
                    compact: false
                };
            }
        }
    },
    data() {
        return {
            //Don't think we need this as it appears to be stacked plot specific
            // hideExportButtons: false
            cursorGuide: false,
            gridLines: !this.options.compact,
            loading: false
        };
    },
    mounted() {
        eventHelpers.extend(this);

        this.exportImageService = this.openmct.$injector.get('exportImageService');
    },
    beforeDestroy() {
        this.destroy();
    },
    methods: {
        loadingUpdated(loading) {
            this.loading = loading;
        },
        destroy() {
            this.stopListening();
        },

        exportJPG() {
            const plotElement = this.$refs.plotContainer;

            this.exportImageService.exportJPG(plotElement, 'plot.jpg', 'export-plot');
        },

        exportPNG() {
            const plotElement = this.$refs.plotContainer;

            this.exportImageService.exportPNG(plotElement, 'plot.png', 'export-plot');
        },

        toggleCursorGuide() {
            this.cursorGuide = !this.cursorGuide;
        },

        toggleGridLines() {
            this.gridLines = !this.gridLines;
        }
    }
};

</script>
