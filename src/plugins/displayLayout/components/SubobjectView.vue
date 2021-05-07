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
    :title="domainObject && domainObject.name"
    :is-editing="isEditing"
    @move="(gridDelta) => $emit('move', gridDelta)"
    @endMove="() => $emit('endMove')"
>
    <object-frame
        v-if="domainObject"
        ref="objectFrame"
        :domain-object="domainObject"
        :object-path="currentObjectPath"
        :has-frame="item.hasFrame"
        :show-edit-view="false"
        :layout-font-size="item.fontSize"
        :layout-font="item.font"
    />
</layout-frame>
</template>

<script>
import ObjectFrame from '../../../ui/components/ObjectFrame.vue';
import LayoutFrame from './LayoutFrame.vue';

const MINIMUM_FRAME_SIZE = [320, 180];
const DEFAULT_DIMENSIONS = [10, 10];
const DEFAULT_POSITION = [1, 1];
const DEFAULT_HIDDEN_FRAME_TYPES = ['hyperlink', 'summary-widget', 'conditionWidget'];

function getDefaultDimensions(gridSize) {
    return MINIMUM_FRAME_SIZE.map((min, index) => {
        return Math.max(
            Math.ceil(min / gridSize[index]),
            DEFAULT_DIMENSIONS[index]
        );
    });
}

function hasFrameByDefault(type) {
    return DEFAULT_HIDDEN_FRAME_TYPES.indexOf(type) === -1;
}

export default {
    makeDefinition(openmct, gridSize, domainObject, position, viewKey) {
        let defaultDimensions = getDefaultDimensions(gridSize);
        position = position || DEFAULT_POSITION;

        return {
            width: defaultDimensions[0],
            height: defaultDimensions[1],
            x: position[0],
            y: position[1],
            identifier: domainObject.identifier,
            hasFrame: hasFrameByDefault(domainObject.type),
            fontSize: 'default',
            font: 'default',
            viewKey
        };
    },
    components: {
        ObjectFrame,
        LayoutFrame
    },
    inject: ['openmct', 'objectPath'],
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
            domainObject: undefined,
            currentObjectPath: [],
            mutablePromise: undefined
        };
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
    },
    beforeDestroy() {
        if (this.removeSelectable) {
            this.removeSelectable();
        }

        if (this.mutablePromise) {
            this.mutablePromise.then(() => {
                this.openmct.objects.destroyMutable(this.domainObject);
            });
        } else if (this.domainObject.isMutable) {
            this.openmct.objects.destroyMutable(this.domainObject);
        }
    },
    methods: {
        setObject(domainObject) {
            this.domainObject = domainObject;
            this.mutablePromise = undefined;
            this.currentObjectPath = [this.domainObject].concat(this.objectPath.slice());
            this.$nextTick(() => {
                let reference = this.$refs.objectFrame;

                if (reference) {
                    let childContext = this.$refs.objectFrame.getSelectionContext();
                    childContext.item = domainObject;
                    childContext.layoutItem = this.item;
                    childContext.index = this.index;
                    this.context = childContext;
                    this.removeSelectable = this.openmct.selection.selectable(
                        this.$el, this.context, this.immediatelySelect || this.initSelect);
                    delete this.immediatelySelect;
                }
            });
        }
    }
};
</script>
