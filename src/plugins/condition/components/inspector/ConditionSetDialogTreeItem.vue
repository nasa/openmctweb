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
<li class="c-tree__item-h">
    <div
        class="c-tree__item"
        :class="{ 'is-alias': isAlias, 'is-navigated-object': navigated }"
        @click="handleItemSelected(node.object, node)"
    >
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :enabled="hasChildren"
        />
        <div class="c-tree__item__label c-object-label">
            <div
                class="c-tree__item__type-icon c-object-label__type-icon"
                :class="typeClass"
            ></div>
            <div class="c-tree__item__name c-object-label__name">{{ node.object.name }}</div>
        </div>
    </div>
    <ul
        v-if="expanded && !isLoading"
        class="c-tree"
    >
        <li
            v-if="isLoading && !loaded"
            class="c-tree__item-h"
        >
            <div class="c-tree__item loading">
                <span class="c-tree__item__label">Loading...</span>
            </div>
        </li>
        <condition-set-dialog-tree-item
            v-for="child in children"
            :key="child.id"
            :node="child"
            :selected-item="selectedItem"
            :handle-item-selected="handleItemSelected"
        />
    </ul>
</li>
</template>

<script>
import viewControl from '@/ui/components/viewControl.vue';

export default {
    name: 'ConditionSetDialogTreeItem',
    components: {
        viewControl
    },
    inject: ['openmct'],
    props: {
        node: {
            type: Object,
            required: true
        },
        selectedItem: {
            type: Object,
            default() {
                return undefined;
            }
        },
        handleItemSelected: {
            type: Function,
            default() {
                return (item) => {};
            }
        }
    },
    data() {
        return {
            hasChildren: false,
            isLoading: false,
            loaded: false,
            children: [],
            expanded: false
        };
    },
    computed: {
        navigated() {
            const itemId = this.selectedItem && this.selectedItem.itemId;
            const isSelectedObject = itemId && this.openmct.objects.areIdsEqual(this.node.object.identifier, itemId);
            if (isSelectedObject && this.node.objectPath && this.node.objectPath.length > 1) {
                const isParent = this.openmct.objects.areIdsEqual(this.node.objectPath[1].identifier, this.selectedItem.parentId);

                return isSelectedObject && isParent;
            }

            return isSelectedObject;
        },
        isAlias() {
            let parent = this.node.objectPath[1];
            if (!parent) {
                return false;
            }

            let parentKeyString = this.openmct.objects.makeKeyString(parent.identifier);

            return parentKeyString !== this.node.object.location;
        },
        typeClass() {
            let type = this.openmct.types.get(this.node.object.type);
            if (!type) {
                return 'icon-object-unknown';
            }

            return type.definition.cssClass;
        }
    },
    watch: {
        expanded() {
            if (!this.hasChildren) {
                return;
            }

            if (!this.loaded && !this.isLoading) {
                this.composition = this.openmct.composition.get(this.domainObject);
                this.composition.on('add', this.addChild);
                this.composition.on('remove', this.removeChild);
                this.composition.load().then(this.finishLoading);
                this.isLoading = true;
            }
        }
    },
    mounted() {
        this.domainObject = this.node.object;
        let removeListener = this.openmct.objects.observe(this.domainObject, '*', (newObject) => {
            this.domainObject = newObject;
        });

        this.$once('hook:destroyed', removeListener);
        if (this.openmct.composition.get(this.node.object)) {
            this.hasChildren = true;
        }

    },
    beforeDestroy() {
        this.expanded = false;
    },
    destroyed() {
        if (this.composition) {
            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            delete this.composition;
        }
    },
    methods: {
        addChild(child) {
            this.children.push({
                id: this.openmct.objects.makeKeyString(child.identifier),
                object: child,
                objectPath: [child].concat(this.node.objectPath),
                navigateToParent: this.navigateToPath
            });
        },
        removeChild(identifier) {
            let removeId = this.openmct.objects.makeKeyString(identifier);
            this.children = this.children
                .filter(c => c.id !== removeId);
        },
        finishLoading() {
            this.isLoading = false;
            this.loaded = true;
        }
    }
};
</script>
