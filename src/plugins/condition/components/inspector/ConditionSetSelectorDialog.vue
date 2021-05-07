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
<div class="u-contents">
    <div class="c-overlay__top-bar">
        <div class="c-overlay__dialog-title">Select Condition Set</div>
    </div>
    <div class="c-overlay__contents-main c-selector c-tree-and-search">
        <div class="c-tree-and-search__search">
            <search ref="shell-search"
                    class="c-search"
                    :value="searchValue"
                    @input="searchTree"
                    @clear="searchTree"
            />
        </div>

        <!-- loading -->
        <div v-if="isLoading"
             class="c-tree-and-search__loading loading"
        ></div>
        <!-- end loading -->

        <div v-if="shouldDisplayNoResultsText"
             class="c-tree-and-search__no-results"
        >
            No results found
        </div>

        <!-- main tree -->
        <ul v-if="!isLoading"
            v-show="!searchValue"
            class="c-tree-and-search__tree c-tree"
        >
            <condition-set-dialog-tree-item
                v-for="treeItem in allTreeItems"
                :key="treeItem.id"
                :node="treeItem"
                :selected-item="selectedItem"
                :handle-item-selected="handleItemSelection"
            />
        </ul>
        <!-- end main tree -->

        <!-- search tree -->
        <ul v-if="searchValue && !isLoading"
            class="c-tree-and-search__tree c-tree"
        >
            <condition-set-dialog-tree-item
                v-for="treeItem in filteredTreeItems"
                :key="treeItem.id"
                :node="treeItem"
                :selected-item="selectedItem"
                :handle-item-selected="handleItemSelection"
            />
        </ul>
        <!-- end search tree -->
    </div>
</div>
</template>

<script>
import debounce from 'lodash/debounce';
import search from '@/ui/components/search.vue';
import ConditionSetDialogTreeItem from './ConditionSetDialogTreeItem.vue';

export default {
    name: 'ConditionSetSelectorDialog',
    components: {
        search,
        ConditionSetDialogTreeItem
    },
    inject: ['openmct'],
    data() {
        return {
            expanded: false,
            searchValue: '',
            allTreeItems: [],
            filteredTreeItems: [],
            isLoading: false,
            selectedItem: undefined
        };
    },
    computed: {
        shouldDisplayNoResultsText() {
            if (this.isLoading) {
                return false;
            }

            return this.allTreeItems.length === 0
                || (this.searchValue && this.filteredTreeItems.length === 0);
        }
    },
    created() {
        this.getDebouncedFilteredChildren = debounce(this.getFilteredChildren, 400);
    },
    mounted() {
        this.getAllChildren();
    },
    methods: {
        getAllChildren() {
            this.isLoading = true;
            this.openmct.objects.get('ROOT')
                .then(root => {
                    return this.openmct.composition.get(root).load();
                })
                .then(children => {
                    this.isLoading = false;
                    this.allTreeItems = children.map(c => {
                        return {
                            id: this.openmct.objects.makeKeyString(c.identifier),
                            object: c,
                            objectPath: [c],
                            navigateToParent: '/browse'
                        };
                    });
                });
        },
        getFilteredChildren() {
            // clear any previous search results
            this.filteredTreeItems = [];

            const promises = this.openmct.objects.search(this.searchValue)
                .map(promise => promise
                    .then(results => this.aggregateFilteredChildren(results)));

            Promise.all(promises).then(() => {
                this.isLoading = false;
            });
        },
        async aggregateFilteredChildren(results) {
            for (const object of results) {
                const objectPath = await this.openmct.objects.getOriginalPath(object.identifier);

                const navigateToParent = '/browse/'
                    + objectPath.slice(1)
                        .map(parent => this.openmct.objects.makeKeyString(parent.identifier))
                        .join('/');

                const filteredChild = {
                    id: this.openmct.objects.makeKeyString(object.identifier),
                    object,
                    objectPath,
                    navigateToParent
                };

                this.filteredTreeItems.push(filteredChild);
            }
        },
        searchTree(value) {
            this.searchValue = value;
            this.isLoading = true;

            if (this.searchValue !== '') {
                this.getDebouncedFilteredChildren();
            } else {
                this.isLoading = false;
            }
        },
        handleItemSelection(item, node) {
            if (item && item.type === 'conditionSet') {
                const parentId = (node.objectPath && node.objectPath.length > 1) ? node.objectPath[1].identifier : undefined;
                this.selectedItem = {
                    itemId: item.identifier,
                    parentId
                };
                this.$emit('conditionSetSelected', item);
            }
        }
    }
};
</script>
