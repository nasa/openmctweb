<template>
<div class="c-tree-and-search">

    <div
        ref="search"
        class="c-tree-and-search__search"
    >
        <search
            ref="shell-search"
            class="c-search"
            :value="searchValue"
            @input="searchTree"
            @clear="searchTree"
        />
    </div>

    <!-- search loading -->
    <div
        v-if="searchLoading && activeSearch"
        class="c-tree__item c-tree-and-search__loading loading"
    >
        <span class="c-tree__item__label">Searching...</span>
    </div>

    <!-- no results -->
    <div
        v-if="showNoSearchResults"
        class="c-tree-and-search__no-results"
    >
        No results found
    </div>

    <!-- main tree -->
    <div
        ref="mainTree"
        class="c-tree-and-search__tree c-tree"
    >
        <!-- ancestors -->
        <div v-if="!activeSearch">

            <div
                ref="dummyItem"
                class="c-tree__item-h"
                style="left: -1000px; position: absolute; visibility: hidden"
            >
                <div class="c-tree__item">
                    <span class="c-tree__item__view-control c-nav__up is-enabled"></span>
                    <a
                        class="c-tree__item__label c-object-label"
                        draggable="true"
                        href="#"
                    >
                        <div class="c-tree__item__type-icon c-object-label__type-icon icon-folder">
                            <span title="Open MCT"></span>
                        </div>
                        <div class="c-tree__item__name c-object-label__name">
                            Open MCT
                        </div>
                    </a>
                    <span class="c-tree__item__view-control c-nav__down"></span>
                </div>
            </div>

            <tree-item
                v-for="(ancestor, index) in focusedAncestors"
                :key="ancestor.id"
                :node="ancestor"
                :show-up="index !== 0 && index < focusedAncestors.length && initialLoad"
                :show-down="false"
                :left-offset="index * 10 + 'px'"
                @resetTree="beginNavigationRequest('handleReset', ancestor)"
            />
            <!-- loading -->
            <div
                v-if="isLoading"
                :style="indicatorLeftOffset"
                class="c-tree__item c-tree-and-search__loading loading"
            >
                <span class="c-tree__item__label">Loading...</span>
            </div>
            <!-- end loading -->
        </div>

        <!-- currently viewed children -->
        <transition
            name="children"
            appear
            @after-enter="autoScroll"
        >
            <div
                v-if="showChildContainer"
                :style="childrenListStyles()"
                :class="childrenSlideClass"
            >
                <div
                    ref="scrollable"
                    class="c-tree__scrollable-children"
                    :style="scrollableStyles()"
                    @scroll="scrollItems"
                >
                    <div :style="{ height: childrenHeight + 'px' }">
                        <tree-item
                            v-for="(treeItem, index) in visibleItems"
                            :key="treeItem.id"
                            :node="treeItem"
                            :left-offset="itemLeftOffset"
                            :item-offset="itemOffset"
                            :item-index="index"
                            :item-height="itemHeight"
                            :virtual-scroll="true"
                            :show-down="activeSearch ? false : true"
                            @expanded="beginNavigationRequest('handleExpanded', treeItem)"
                        />
                        <div
                            v-if="showNoItems"
                            :style="indicatorLeftOffset"
                            class="c-tree__item c-tree__item--empty"
                        >
                            No items
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
    <!-- end main tree -->

</div>
</template>

<script>
import _ from 'lodash';
import treeItem from './tree-item.vue';
import search from '../components/search.vue';
import uuid from 'uuid';

const ROOT_PATH = 'browse';
const ITEM_BUFFER = 5;

export default {
    name: 'MctTree',
    components: {
        search,
        treeItem
    },
    inject: ['openmct'],
    props: {
        syncTreeNavigation: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            root: undefined,
            initialLoad: false,
            isLoading: false,
            mainTreeHeight: undefined,
            searchLoading: false,
            searchValue: '',
            childItems: [],
            searchResultItems: [],
            visibleItems: [],
            ancestors: [],
            tempAncestors: [],
            childrenSlideClass: 'down',
            updatingView: false,
            itemHeight: 27,
            itemOffset: 0,
            activeSearch: false,
            multipleRootChildren: false,
            observedAncestors: {},
            mainTreeTopMargin: undefined
        };
    },
    computed: {
        currentTreePath() {
            let path = [...this.ancestors]
                .map((ancestor) => ancestor.id)
                .join('/');

            // if not multiRootChildren, then need to add in root ('browse')
            if (!this.multipleRootChildren) {
                path = ROOT_PATH + '/' + path;
            // if multiRootChldren, need to replace root id with 'browse'
            } else {
                path = path.replace('ROOT', ROOT_PATH);
            }

            return path;
        },
        focusedItems() {
            return this.activeSearch ? this.searchResultItems : this.childItems;
        },
        focusedAncestors() {
            return this.isLoading ? this.tempAncestors : this.ancestors;
        },
        itemLeftOffset() {
            return this.activeSearch ? '0px' : this.ancestors.length * 10 + 'px';
        },
        indicatorLeftOffset() {
            let offset = ((this.focusedAncestors.length + 1) * 10);

            return {
                paddingLeft: offset + 'px'
            };
        },
        ancestorsHeight() {
            if (this.activeSearch) {
                return 0;
            }

            return this.itemHeight * this.ancestors.length;
        },
        pageThreshold() {
            return Math.ceil(this.availableContainerHeight / this.itemHeight) + ITEM_BUFFER;
        },
        childrenHeight() {
            let childrenCount = this.focusedItems.length || 1;

            return (this.itemHeight * childrenCount) - this.mainTreeTopMargin; // 5px margin
        },
        availableContainerHeight() {
            return this.mainTreeHeight - this.ancestorsHeight;
        },
        showNoItems() {
            return this.visibleItems.length === 0 && !this.activeSearch && !this.isLoading;
        },
        showNoSearchResults() {
            return this.searchValue && this.searchResultItems.length === 0 && !this.searchLoading;
        },
        showChildContainer() {
            return !this.isLoading && !this.searchLoading;
        }
    },
    watch: {
        syncTreeNavigation() {
            // if there is an abort controller, then a search is in progress and will need to be canceled
            if (this.abortController) {
                this.abortController.abort();
                delete this.abortController;
            }

            this.searchValue = '';

            if (!this.openmct.router.path) {
                return;
            }

            if (this.currentPathIsActivePath() && !this.isLoading) {
                this.skipScroll = false;
                this.autoScroll();

                return;
            }

            let routePath = [...this.openmct.router.path];
            routePath.shift(); // remove the child, so it navigates to the parent
            routePath.push(this.root); // adding root
            this.beginNavigationRequest('jumpTo', [...routePath].reverse());
        },
        searchValue() {
            if (this.searchValue !== '' && !this.activeSearch) {
                this.activeSearch = true;
                this.$refs.scrollable.scrollTop = 0;
                this.skipScroll = true;
            } else if (this.searchValue === '') {
                this.activeSearch = false;
                this.skipScroll = false;
            }
        },
        ancestors() {
            this.observeAncestors();
        },
        availableContainerHeight() {
            this.updateVisibleItems();
        },
        focusedItems() {
            this.updateVisibleItems();
        }
    },
    async mounted() {
        this.isLoading = true;

        await this.initialize();

        let rootComposition = await this.loadRoot();
        let path = ROOT_PATH;

        if (!rootComposition) {
            return;
        }

        if (!this.multipleRootChildren && rootComposition[0]) {
            let id = this.openmct.objects.makeKeyString(rootComposition[0].identifier);
            path += '/' + id;
        }

        this.beginNavigationRequest('jumpTo', path);
    },
    created() {
        this.getSearchResults = _.debounce(this.getSearchResults, 400);
        this.handleWindowResize = _.debounce(this.handleWindowResize, 500);
    },
    destroyed() {
        window.removeEventListener('resize', this.handleWindowResize);
        this.stopObservingAncestors();
    },
    methods: {
        async initialize() {
            // required to index tree objects that do not have search providers
            this.openmct.$injector.get('searchService');

            window.addEventListener('resize', this.handleWindowResize);

            await this.calculateHeights();

            return;
        },
        async loadRoot() {
            this.root = await this.openmct.objects.get('ROOT');

            if (!this.root.identifier) {
                return false;
            }

            let rootCompositionCollection = this.openmct.composition.get(this.root);
            let rootComposition = await rootCompositionCollection.load();

            if (rootComposition.length > 1) {
                this.multipleRootChildren = true;
            }

            return rootComposition;
        },
        async beginNavigationRequest(type, request) {
            let requestId = uuid();

            this.isLoading = true;
            this.latestNavigationRequest = requestId;

            if (['handleReset', 'handleExpanded'].indexOf(type) !== -1) {
                this.skipScroll = true;
            } else {
                this.skipScroll = false;
            }

            let success = await this[type](request, requestId);

            if (success && this.isLatestNavigationRequest(requestId)) {
                this.isLoading = false;
            }
        },
        isLatestNavigationRequest(requestId) {
            return this.latestNavigationRequest === requestId;
        },
        // will jump to an object path or a string path
        async jumpTo(path, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            // if path string, build object string
            if (typeof path === 'string') {
                path = await this.buildObjectPathFromString(path, requestId);

                if (!path) {
                    return false;
                }
            }

            // build ancestors tree items from objects
            this.tempAncestors = [];

            for (let i = 0; i < path.length; i++) {
                let builtAncestor = this.buildTreeItem(path[i], path.slice(0, i));
                this.tempAncestors.push(builtAncestor);
            }

            // load children for last ancestor
            let childrenItems = await this.getChildrenAsTreeItems(this.tempAncestors[this.tempAncestors.length - 1], path, requestId);

            // if all is good, return true for successful navigation
            return this.updateTree(this.tempAncestors, childrenItems, requestId);
        },
        async handleReset(node, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            this.childrenSlideClass = 'up';

            let index = this.tempAncestors.indexOf(node);

            this.tempAncestors = [...this.ancestors];
            this.tempAncestors.splice(index);

            let parentNode = this.tempAncestors[index - 1];

            let objectPath = this.ancestorsAsObjects();
            objectPath.splice(objectPath.indexOf(node.object));

            let childrenItems = await this.getChildrenAsTreeItems(parentNode, objectPath, requestId);

            // if all is good, return true for successful navigation
            return this.updateTree(this.tempAncestors, childrenItems, requestId);
        },
        async handleExpanded(node, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            this.childrenSlideClass = 'down';

            this.tempAncestors = [...this.ancestors];
            this.tempAncestors.push(node);

            let objectPath = this.ancestorsAsObjects().concat(node.object);

            let childrenItems = await this.getChildrenAsTreeItems(node, objectPath, requestId);

            // if all is good, return true for successful navigation
            return this.updateTree(this.tempAncestors, childrenItems, requestId);

        },
        ancestorsAsObjects() {
            let ancestorsCopy = [...this.ancestors];

            if (this.multipleRootChildren && ancestorsCopy[0].id === 'ROOT') {
                // no root for object paths
                ancestorsCopy.shift();
            }

            return ancestorsCopy.map(item => item.object);
        },
        async buildObjectPathFromString(path, requestId) {
            let pathNodes = path.split('/');
            let objectPath = [this.root];

            // skip first element, it's root "browse" path, handled above
            for (let i = 1; i < pathNodes.length; i++) {
                let domainObject = await this.openmct.objects.get(pathNodes[i]);
                objectPath.push(domainObject);

                if (!this.isLatestNavigationRequest(requestId)) {
                    return false;
                }
            }

            return objectPath;
        },
        async getChildrenAsTreeItems(item, parentObjectPath, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            if (this.composition) {
                this.composition.off('add', this.addChild);
                this.composition.off('remove', this.removeChild);
                delete this.composition;
            }

            this.childItems = [];
            let tempComposition = this.openmct.composition.get(item.object);
            let children = await tempComposition.load();

            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            this.composition = tempComposition;

            return children.map((child) => {
                return this.buildTreeItem(child, parentObjectPath);
            });
        },
        async updateTree(ancestors, children, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            // show or don't show root
            if (!this.multipleRootChildren && ancestors[0].id === 'ROOT') {
                ancestors.shift();
            }

            await this.clearVisibleItems();

            this.ancestors = ancestors;
            this.childItems = children;

            // track when FIRST full load of tree happens
            if (!this.initialLoad) {
                this.initialLoad = true;
            }

            // any new items added or removed handled here
            this.composition.on('add', this.addChild);
            this.composition.on('remove', this.removeChild);

            return true;
        },
        // domainObject: from composition add event
        addChild(domainObject) {
            let item = this.buildTreeItem(domainObject, this.ancestorsAsObjects());
            this.childItems.push(item);
        },
        removeChild(identifier) {
            let removeId = this.openmct.objects.makeKeyString(identifier);
            this.childItems = this.childItems
                .filter(c => c.id !== removeId);
        },
        updateVisibleItems() {
            if (this.updatingView) {
                return;
            }

            this.updatingView = true;
            requestAnimationFrame(() => {
                let start = 0;
                let end = this.pageThreshold;
                let allItemsCount = this.focusedItems.length;

                if (allItemsCount < this.pageThreshold) {
                    end = allItemsCount;
                } else {
                    let firstVisible = this.calculateFirstVisibleItem();
                    let lastVisible = this.calculateLastVisibleItem();
                    let totalVisible = lastVisible - firstVisible;
                    let numberOffscreen = this.pageThreshold - totalVisible;

                    start = firstVisible - Math.floor(numberOffscreen / 2);
                    end = lastVisible + Math.ceil(numberOffscreen / 2);

                    if (start < 0) {
                        start = 0;
                        end = Math.min(this.pageThreshold, allItemsCount);
                    } else if (end >= allItemsCount) {
                        end = allItemsCount;
                        start = end - this.pageThreshold + 1;
                    }
                }

                this.itemOffset = start;
                this.visibleItems = this.focusedItems.slice(start, end);

                this.updatingView = false;
            });
        },
        calculateFirstVisibleItem() {
            if (!this.$refs.scrollable) {
                return;
            }

            let scrollTop = this.$refs.scrollable.scrollTop;

            return Math.floor(scrollTop / this.itemHeight);
        },
        calculateLastVisibleItem() {
            if (!this.$refs.scrollable) {
                return;
            }

            let scrollBottom = this.$refs.scrollable.scrollTop + this.$refs.scrollable.offsetHeight;

            return Math.ceil(scrollBottom / this.itemHeight);
        },
        scrollItems(event) {
            this.updateVisibleItems();
        },
        handleWindowResize() {
            this.calculateHeights();
        },
        // domainObject: we're building a tree item for this
        // objects: domainObject array up to parent of domainObject, excluding domainObject for item being built
        buildTreeItem(domainObject, objects) {
            let objectPath = [...objects];

            // remove root (if present) for object path
            if (objectPath[0] && objectPath[0].type === 'root') {
                objectPath.shift();
            }

            let navigationPath = this.buildNavigationPath(domainObject, objectPath);
            let builtObjectPath = [...objectPath].reverse();

            return {
                id: this.openmct.objects.makeKeyString(domainObject.identifier),
                object: domainObject,
                objectPath: [domainObject].concat(builtObjectPath),
                navigationPath
            };
        },
        // domainObject: the item we're building the path for (will be used in url and links)
        // objects: array of domainObjects representing path to domainobject passed in
        buildNavigationPath(domainObject, objects) {
            let path = [...objects]
                .map(object => this.openmct.objects.makeKeyString(object.identifier));

            return '/' + [
                ROOT_PATH,
                ...path,
                this.openmct.objects.makeKeyString(domainObject.identifier)
            ].join('/');
        },
        observeAncestors() {
            let observedAncestorIds = Object.keys(this.observedAncestors);

            // observe any ancestors, not currently being observed
            this.ancestors.forEach((ancestor, index) => {
                // skip last ancestor as it's children are currently being watched
                if (index !== this.ancestors.length - 1) {
                    let ancestorKeyString = this.openmct.objects.makeKeyString(ancestor.object.identifier);
                    let ancestorIndex = observedAncestorIds.indexOf(ancestorKeyString);

                    if (ancestorIndex !== -1) { // currently observed
                        observedAncestorIds.splice(ancestorIndex, 1); // remove all active ancestors from id tracking
                    } else { // not observed, observe it
                        this.observeAncestor(ancestorKeyString, ancestor);
                    }
                }
            });

            // remove any ancestors currnetly being observed that are no longer active ancestors
            this.stopObservingAncestors(observedAncestorIds);
        },
        stopObservingAncestors(ids = Object.keys(this.observedAncestors)) {
            ids.forEach((id) => {
                this.observedAncestors[id].composition.off('add', this.observedAncestors[id].addChild);
                this.observedAncestors[id].composition.off('remove', this.observedAncestors[id].removeChild);
                this.observedAncestors[id].removeChild = undefined;
                this.observedAncestors[id].addChild = undefined;
                this.observedAncestors[id].composition = undefined;

                // remove tracking for this id
                this.observedAncestors[id] = undefined;
                delete this.observedAncestors[id];
            });
        },
        async observeAncestor(id, ancestorNode) {
            this.observedAncestors[id] = {};

            this.observedAncestors[id].composition = this.openmct.composition.get(ancestorNode.object);
            await this.observedAncestors[id].composition.load();
            this.observedAncestors[id].addChild = this.ancestorAdd(ancestorNode);
            this.observedAncestors[id].removeChild = this.ancestorRemove(ancestorNode);
            this.observedAncestors[id].composition.on('add', this.observedAncestors[id].addChild);
            this.observedAncestors[id].composition.on('remove', this.observedAncestors[id].removeChild);
            // }
        },
        ancestorAdd(ancestor) {
            return (node) => {
                // no use case for this as of yet since ancestors do not show siblings
                // and the main ancestor being viewed currently has it's composition watched elsewhere
            };
        },
        ancestorRemove(ancestorNode) {
            return (identifier) => {
                // check if this item is showing in the tree currently
                let index = this.ancestors.findIndex(treeAncestor => {
                    let treeAncestorIdentifier = this.openmct.objects.makeKeyString(treeAncestor.object.identifier);
                    let removedItemIdentifier = this.openmct.objects.makeKeyString(identifier);

                    return treeAncestorIdentifier === removedItemIdentifier;
                });

                if (index !== -1) {
                    let ancestorIndex = this.ancestors.indexOf(ancestorNode);
                    this.beginNavigationRequest('handleReset', this.ancestors[ancestorIndex]);
                }
            };
        },
        autoScroll() {
            if (this.currentPathIsActivePath() && !this.skipScroll && this.$refs.scrollable) {
                let indexOfScroll = this.indexOfItemById(this.currentlyViewedObjectId());
                let scrollTopAmount = indexOfScroll * this.itemHeight;
                this.$refs.scrollable.scrollTo({
                    top: scrollTopAmount,
                    behavior: 'smooth'
                });
            }
        },
        indexOfItemById(id) {
            for (let i = 0; i < this.childItems.length; i++) {
                if (this.childItems[i].id === id) {
                    return i;
                }
            }
        },
        getSearchResults() {
            // clear any previous search results
            this.searchResultItems = [];

            // an abort controller will be passed in that will be used
            // to cancel an active searches if necessary
            this.abortController = new AbortController();
            const abortSignal = this.abortController.signal;

            const promises = this.openmct.objects.search(this.searchValue, abortSignal)
                .map(promise => promise
                    .then(results => this.aggregateSearchResults(results, abortSignal)));

            Promise.all(promises).then(() => {
                this.searchLoading = false;
            }).catch(reason => {
                // search aborted
            }).finally(() => {
                if (this.abortController) {
                    delete this.abortController;
                }
            });
        },
        aggregateSearchResults(results, abortSignal) {
            for (const result of results) {
                if (!abortSignal.aborted) {
                    this.openmct.objects.getOriginalPath(result.identifier).then((objectPath) => {
                        // removing the item itself, as the path we pass to buildTreeItem is a parent path
                        objectPath.shift();

                        // if root, remove, we're not using in object path for tree
                        let lastObject = objectPath.length ? objectPath[objectPath.length - 1] : false;
                        if (lastObject && lastObject.type === 'root') {
                            objectPath.pop();
                        }

                        // we reverse the objectPath in the tree, so have to do it here first,
                        // since this one is already in the correct direction
                        let resultObject = this.buildTreeItem(result, objectPath.reverse());

                        this.searchResultItems.push(resultObject);
                    });
                }
            }
        },
        searchTree(value) {
            // if an abort controller exists, regardless of the value passed in,
            // there is an active search that should be cancled
            if (this.abortController) {
                this.abortController.abort();
                delete this.abortController;
            }

            this.searchValue = value;
            this.searchLoading = true;

            if (this.searchValue !== '') {
                this.getSearchResults();
            } else {
                this.searchLoading = false;
            }
        },
        currentPathIsActivePath() {
            return this.currentTreePath === this.currentlyViewedObjectParentPath();
        },
        currentlyViewedObjectId() {
            let currentPath = this.openmct.router.currentLocation.path;
            if (currentPath) {
                return currentPath.split('/').pop();
            }
        },
        currentlyViewedObjectParentPath() {
            let currentPath = this.openmct.router.currentLocation.path;

            if (currentPath) {
                currentPath = currentPath.split('/');
                currentPath.shift(); // remove empty array element from initial '/'
                currentPath.pop(); // remove current child

                return currentPath.join('/');
            }
        },
        async clearVisibleItems() {
            this.visibleItems = [];
            await this.$nextTick(); // prevents "ghost" image of visibleItems

            return;
        },
        childrenListStyles() {
            return { position: 'relative' };
        },
        scrollableStyles() {
            let height = this.availableContainerHeight + 'px';

            return { height };
        },
        getElementStyleValue(el, style) {
            if (!el) {
                return;
            }

            let styleString = window.getComputedStyle(el)[style];
            let index = styleString.indexOf('px');

            return Number(styleString.slice(0, index));
        },
        calculateHeights() {
            const RECHECK = 100;

            return new Promise((resolve, reject) => {

                let checkHeights = () => {
                    let treeTopMargin = this.getElementStyleValue(this.$refs.mainTree, 'marginTop');
                    if (
                        this.$el
                        && this.$refs.search
                        && this.$refs.mainTree
                        && this.$refs.dummyItem
                        && this.$el.offsetHeight !== 0
                        && treeTopMargin > 0
                    ) {
                        this.mainTreeTopMargin = treeTopMargin;
                        this.mainTreeHeight = this.$el.offsetHeight
                            - this.$refs.search.offsetHeight
                            - this.mainTreeTopMargin;
                        this.itemHeight = this.getElementStyleValue(this.$refs.dummyItem, 'height');

                        resolve();
                    } else {
                        setTimeout(checkHeights, RECHECK);
                    }
                };

                checkHeights();
            });
        }
    }
};
</script>
