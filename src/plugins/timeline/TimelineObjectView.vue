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
<swim-lane :icon-class="item.type.definition.cssClass"
           :min-height="item.height"
           :show-ucontents="item.domainObject.type === 'plan'"
           :span-rows-count="item.rowCount"
>
    <template slot="label">
        {{ item.domainObject.name }}
    </template>
    <object-view
        ref="objectView"
        slot="object"
        class="u-contents"
        :default-object="item.domainObject"
        :object-view-key="item.viewKey"
        :object-path="item.objectPath"
    />
</swim-lane>
</template>

<script>
import ObjectView from '@/ui/components/ObjectView.vue';
import SwimLane from "@/ui/components/swim-lane/SwimLane.vue";

export default {
    components: {
        ObjectView,
        SwimLane
    },
    inject: ['openmct'],
    props: {
        item: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            domainObject: undefined,
            mutablePromise: undefined
        };
    },
    watch: {
        item(newItem) {
            if (!this.context) {
                return;
            }

            this.context.item = newItem.domainObject;
        }
    },
    mounted() {
        if (this.openmct.objects.supportsMutation(this.item.domainObject.identifier)) {
            this.mutablePromise = this.openmct.objects.getMutable(this.item.domainObject.identifier)
                .then(this.setObject);
        } else {
            this.openmct.objects.get(this.item.domainObject.identifier)
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
        } else {
            this.openmct.objects.destroyMutable(this.domainObject);
        }
    },
    methods: {
        setObject(domainObject) {
            this.domainObject = domainObject;
            this.mutablePromise = undefined;
            this.$nextTick(() => {
                let reference = this.$refs.objectView;

                if (reference) {
                    let childContext = this.$refs.objectView.getSelectionContext();
                    childContext.item = domainObject;
                    this.context = childContext;
                    this.removeSelectable = this.openmct.selection.selectable(
                        this.$el, this.context);
                }
            });
        }
    }
};
</script>
