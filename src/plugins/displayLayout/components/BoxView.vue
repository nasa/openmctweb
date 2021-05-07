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
        class="c-box-view u-style-receiver js-style-receiver"
        :class="[styleClass]"
        :style="style"
    ></div>
</layout-frame>
</template>

<script>
import LayoutFrame from './LayoutFrame.vue';
import conditionalStylesMixin from '../mixins/objectStyles-mixin';

export default {
    makeDefinition() {
        return {
            fill: '#717171',
            stroke: '',
            x: 1,
            y: 1,
            width: 10,
            height: 5
        };
    },
    components: {
        LayoutFrame
    },
    mixins: [conditionalStylesMixin],
    inject: ['openmct'],
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
        index: {
            type: Number,
            required: true
        },
        initSelect: Boolean,
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        style() {
            if (this.itemStyle) {
                return this.itemStyle;
            } else {
                return {
                    backgroundColor: this.item.fill,
                    border: this.item.stroke ? '1px solid ' + this.item.stroke : ''
                };
            }
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
        this.context = {
            layoutItem: this.item,
            index: this.index
        };
        this.removeSelectable = this.openmct.selection.selectable(
            this.$el, this.context, this.initSelect);
    },
    destroyed() {
        if (this.removeSelectable) {
            this.removeSelectable();
        }
    }
};
</script>
