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
<div></div>
</template>
<script>

import MctPlot from '../single/MctPlot.vue';
import Vue from "vue";

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        object: {
            type: Object,
            default() {
                return {};
            }
        },
        options: {
            type: Object,
            default() {
                return {};
            }
        },
        gridLines: {
            type: Boolean,
            default() {
                return true;
            }
        },
        cursorGuide: {
            type: Boolean,
            default() {
                return true;
            }
        },
        plotTickWidth: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    watch: {
        gridLines(newGridLines) {
            this.updateComponentProp('gridLines', newGridLines);
        },
        cursorGuide(newCursorGuide) {
            this.updateComponentProp('cursorGuide', newCursorGuide);
        },
        plotTickWidth(width) {
            this.updateComponentProp('plotTickWidth', width);
        }
    },
    mounted() {
        this.updateView();
    },
    methods: {
        updateComponentProp(prop, value) {
            if (this.component) {
                this.component[prop] = value;
            }
        },
        updateView() {
            if (this.component) {
                this.component.$destroy();
                this.component = undefined;
                this.$el.innerHTML = '';
            }

            const onTickWidthChange = this.onTickWidthChange;
            const loadingUpdated = this.loadingUpdated;

            const openmct = this.openmct;
            const object = this.object;

            const getProps = this.getProps;
            let viewContainer = document.createElement('div');
            this.$el.append(viewContainer);

            this.component = new Vue({
                el: viewContainer,
                components: {
                    MctPlot
                },
                provide: {
                    openmct,
                    domainObject: object
                },
                data() {
                    return {
                        ...getProps(),
                        onTickWidthChange,
                        loadingUpdated
                    };
                },
                template: '<div ref="plotWrapper" class="l-view-section u-style-receiver js-style-receiver"><div v-show="!!loading" class="c-loading--overlay loading"></div><mct-plot :grid-lines="gridLines" :cursor-guide="cursorGuide" :plot-tick-width="plotTickWidth" :options="options" @plotTickWidth="onTickWidthChange" @loadingUpdated="loadingUpdated"/></div>'
            });
        },
        onTickWidthChange() {
            this.$emit('plotTickWidth', ...arguments);
        },
        loadingUpdated(loaded) {
            this.loading = loaded;
        },
        getProps() {
            return {
                gridLines: this.gridLines,
                cursorGuide: this.cursorGuide,
                plotTickWidth: this.plotTickWidth,
                loading: this.loading,
                options: this.options
            };
        }
    }
};
</script>
