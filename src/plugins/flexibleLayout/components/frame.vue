
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
<div
    class="c-fl-frame"
    :style="{
        'flex-basis': `${frame.size}%`
    }"
>
    <div
        ref="frame"
        class="c-frame c-fl-frame__drag-wrapper is-selectable u-inspectable is-moveable"
        draggable="true"
        @dragstart="initDrag"
    >
        <object-frame
            v-if="domainObject"
            ref="objectFrame"
            :domain-object="domainObject"
            :object-path="currentObjectPath"
            :has-frame="hasFrame"
            :show-edit-view="false"
        />

        <div
            v-if="isEditing"
            v-show="frame.size && frame.size < 100"
            class="c-fl-frame__size-indicator"
        >
            {{ frame.size }}%
        </div>
    </div>
</div>
</template>

<script>
import ObjectFrame from '../../../ui/components/ObjectFrame.vue';

export default {
    components: {
        ObjectFrame
    },
    inject: ['openmct'],
    props: {
        frame: {
            type: Object,
            required: true
        },
        index: {
            type: Number,
            required: true
        },
        containerIndex: {
            type: Number,
            required: true
        },
        isEditing: {
            type: Boolean,
            default: false
        },
        objectPath: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            domainObject: undefined,
            currentObjectPath: undefined
        };
    },
    computed: {
        hasFrame() {
            return !this.frame.noFrame;
        }
    },
    mounted() {
        if (this.frame.domainObjectIdentifier) {
            this.openmct.objects.get(this.frame.domainObjectIdentifier).then((object) => {
                this.setDomainObject(object);
            });
        }

        this.dragGhost = document.getElementById('js-fl-drag-ghost');
    },
    beforeDestroy() {
        if (this.unsubscribeSelection) {
            this.unsubscribeSelection();
        }
    },
    methods: {
        setDomainObject(object) {
            this.domainObject = object;
            this.currentObjectPath = [object].concat(this.objectPath);
            this.setSelection();
        },
        setSelection() {
            this.$nextTick(() => {
                if (this.$refs && this.$refs.objectFrame) {
                    let childContext = this.$refs.objectFrame.getSelectionContext();
                    childContext.item = this.domainObject;
                    childContext.type = 'frame';
                    childContext.frameId = this.frame.id;
                    this.unsubscribeSelection = this.openmct.selection.selectable(
                        this.$refs.frame, childContext, false);
                }
            });
        },
        initDrag(event) {
            let type = this.openmct.types.get(this.domainObject.type);
            let iconClass = type.definition ? type.definition.cssClass : 'icon-object-unknown';

            if (this.dragGhost) {
                let originalClassName = this.dragGhost.classList[0];
                this.dragGhost.className = '';
                this.dragGhost.classList.add(originalClassName, iconClass);

                this.dragGhost.innerHTML = `<span>${this.domainObject.name}</span>`;
                event.dataTransfer.setDragImage(this.dragGhost, 0, 0);
            }

            event.dataTransfer.setData('frameid', this.frame.id);
            event.dataTransfer.setData('containerIndex', this.containerIndex);
        }
    }
};
</script>
