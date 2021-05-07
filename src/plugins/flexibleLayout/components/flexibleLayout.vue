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
<div class="c-fl">
    <div
        id="js-fl-drag-ghost"
        class="c-fl__drag-ghost"
    ></div>

    <div
        v-if="allContainersAreEmpty"
        class="c-fl__empty"
    >
        <span class="c-fl__empty-message">This Flexible Layout is currently empty</span>
    </div>

    <div
        class="c-fl__container-holder"
        :class="{
            'c-fl--rows': rowsLayout === true
        }"
    >
        <template v-for="(container, index) in containers">
            <drop-hint
                v-if="index === 0 && containers.length > 1"
                :key="index"
                class="c-fl-frame__drop-hint"
                :index="-1"
                :allow-drop="allowContainerDrop"
                @object-drop-to="moveContainer"
            />

            <container-component
                :key="container.id"
                class="c-fl__container"
                :index="index"
                :container="container"
                :rows-layout="rowsLayout"
                :is-editing="isEditing"
                :locked="domainObject.locked"
                :object-path="objectPath"
                @move-frame="moveFrame"
                @new-frame="setFrameLocation"
                @persist="persist"
            />

            <resize-handle
                v-if="index !== (containers.length - 1)"
                :key="index"
                :index="index"
                :orientation="rowsLayout ? 'vertical' : 'horizontal'"
                :is-editing="isEditing"
                @init-move="startContainerResizing"
                @move="containerResizing"
                @end-move="endContainerResizing"
            />

            <drop-hint
                v-if="containers.length > 1"
                :key="index"
                class="c-fl-frame__drop-hint"
                :index="index"
                :allow-drop="allowContainerDrop"
                @object-drop-to="moveContainer"
            />
        </template>
    </div>
</div>
</template>

<script>
import ContainerComponent from './container.vue';
import Container from '../utils/container';
import Frame from '../utils/frame';
import ResizeHandle from './resizeHandle.vue';
import DropHint from './dropHint.vue';

const MIN_CONTAINER_SIZE = 5;

// Resize items so that newItem fits proportionally (newItem must be an element
// of items).  If newItem does not have a size or is sized at 100%, newItem will
// have size set to 1/n * 100, where n is the total number of items.
function sizeItems(items, newItem) {
    if (items.length === 1) {
        newItem.size = 100;
    } else {
        if (!newItem.size || newItem.size === 100) {
            newItem.size = Math.round(100 / items.length);
        }

        let oldItems = items.filter(item => item !== newItem);
        // Resize oldItems to fit inside remaining space;
        let remainder = 100 - newItem.size;
        oldItems.forEach((item) => {
            item.size = Math.round(item.size * remainder / 100);
        });
        // Ensure items add up to 100 in case of rounding error.
        let total = items.reduce((t, item) => t + item.size, 0);
        let excess = Math.round(100 - total);
        oldItems[oldItems.length - 1].size += excess;
    }
}

// Scales items proportionally so total is equal to 100.  Assumes that an item
// was removed from array.
function sizeToFill(items) {
    if (items.length === 0) {
        return;
    }

    let oldTotal = items.reduce((total, item) => total + item.size, 0);
    items.forEach((item) => {
        item.size = Math.round(item.size * 100 / oldTotal);
    });
    // Ensure items add up to 100 in case of rounding error.
    let total = items.reduce((t, item) => t + item.size, 0);
    let excess = Math.round(100 - total);
    items[items.length - 1].size += excess;
}

export default {
    components: {
        ContainerComponent,
        ResizeHandle,
        DropHint
    },
    inject: ['openmct', 'objectPath', 'layoutObject'],
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            domainObject: this.layoutObject,
            newFrameLocation: [],
            identifierMap: {}
        };
    },
    computed: {
        layoutDirectionStr() {
            if (this.rowsLayout) {
                return 'Rows';
            } else {
                return 'Columns';
            }
        },
        containers() {
            return this.domainObject.configuration.containers;
        },
        rowsLayout() {
            return this.domainObject.configuration.rowsLayout;
        },
        allContainersAreEmpty() {
            return this.containers.every(container => container.frames.length === 0);
        }
    },
    mounted() {
        this.buildIdentifierMap();
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('remove', this.removeChildObject);
        this.composition.on('add', this.addFrame);
        this.composition.load();
    },
    beforeDestroy() {
        this.composition.off('remove', this.removeChildObject);
        this.composition.off('add', this.addFrame);
    },
    methods: {
        buildIdentifierMap() {
            this.containers.forEach(container => {
                container.frames.forEach(frame => {
                    let keystring = this.openmct.objects.makeKeyString(frame.domainObjectIdentifier);
                    this.identifierMap[keystring] = true;
                });
            });
        },
        addContainer() {
            let container = new Container();
            this.containers.push(container);
            sizeItems(this.containers, container);
            this.persist();
        },
        deleteContainer(containerId) {
            let container = this.containers.filter(c => c.id === containerId)[0];
            let containerIndex = this.containers.indexOf(container);

            /*
                remove associated domainObjects from composition
            */
            container.frames.forEach(f => {
                this.removeFromComposition(f.domainObjectIdentifier);
            });

            this.containers.splice(containerIndex, 1);

            /*
                add a container when there are no containers in the FL,
                to prevent user from not being able to add a frame via
                drag and drop.
            */
            if (this.containers.length === 0) {
                this.containers.push(new Container(100));
            }

            sizeToFill(this.containers);
            this.setSelectionToParent();
            this.persist();
        },
        moveFrame(toContainerIndex, toFrameIndex, frameId, fromContainerIndex) {
            let toContainer = this.containers[toContainerIndex];
            let fromContainer = this.containers[fromContainerIndex];
            let frame = fromContainer.frames.filter(f => f.id === frameId)[0];
            let fromIndex = fromContainer.frames.indexOf(frame);
            fromContainer.frames.splice(fromIndex, 1);
            sizeToFill(fromContainer.frames);
            toContainer.frames.splice(toFrameIndex + 1, 0, frame);
            sizeItems(toContainer.frames, frame);
            this.persist();
        },
        setFrameLocation(containerIndex, insertFrameIndex) {
            this.newFrameLocation = [containerIndex, insertFrameIndex];
        },
        addFrame(domainObject) {
            let keystring = this.openmct.objects.makeKeyString(domainObject.identifier);

            if (!this.identifierMap[keystring]) {
                let containerIndex = this.newFrameLocation.length ? this.newFrameLocation[0] : 0;
                let container = this.containers[containerIndex];
                let frameIndex = this.newFrameLocation.length ? this.newFrameLocation[1] : container.frames.length;
                let frame = new Frame(domainObject.identifier);

                container.frames.splice(frameIndex + 1, 0, frame);
                sizeItems(container.frames, frame);

                this.newFrameLocation = [];
                this.persist(containerIndex);
                this.identifierMap[keystring] = true;
            }
        },
        deleteFrame(frameId) {
            let container = this.containers
                .filter(c => c.frames.some(f => f.id === frameId))[0];
            let frame = container
                .frames
                .filter((f => f.id === frameId))[0];

            this.removeFromComposition(frame.domainObjectIdentifier);

            this.$nextTick().then(() => {
                sizeToFill(container.frames);
                this.setSelectionToParent();
            });
        },
        removeFromComposition(identifier) {
            this.composition.remove({identifier});
        },
        setSelectionToParent() {
            this.$el.click();
        },
        allowContainerDrop(event, index) {
            if (!event.dataTransfer.types.includes('containerid')) {
                return false;
            }

            let containerId = event.dataTransfer.getData('containerid');
            let container = this.containers.filter((c) => c.id === containerId)[0];
            let containerPos = this.containers.indexOf(container);

            if (index === -1) {
                return containerPos !== 0;
            } else {
                return containerPos !== index && (containerPos - 1) !== index;
            }
        },
        persist(index) {
            if (index) {
                this.openmct.objects.mutate(this.domainObject, `configuration.containers[${index}]`, this.containers[index]);
            } else {
                this.openmct.objects.mutate(this.domainObject, 'configuration.containers', this.containers);
            }
        },
        startContainerResizing(index) {
            let beforeContainer = this.containers[index];
            let afterContainer = this.containers[index + 1];

            this.maxMoveSize = beforeContainer.size + afterContainer.size;
        },
        containerResizing(index, delta, event) {
            let percentageMoved = Math.round(delta / this.getElSize() * 100);
            let beforeContainer = this.containers[index];
            let afterContainer = this.containers[index + 1];

            beforeContainer.size = this.getContainerSize(beforeContainer.size + percentageMoved);
            afterContainer.size = this.getContainerSize(afterContainer.size - percentageMoved);
        },
        endContainerResizing(event) {
            this.persist();
        },
        getElSize() {
            if (this.rowsLayout) {
                return this.$el.offsetHeight;
            } else {
                return this.$el.offsetWidth;
            }
        },
        getContainerSize(size) {
            if (size < MIN_CONTAINER_SIZE) {
                return MIN_CONTAINER_SIZE;
            } else if (size > (this.maxMoveSize - MIN_CONTAINER_SIZE)) {
                return (this.maxMoveSize - MIN_CONTAINER_SIZE);
            } else {
                return size;
            }
        },
        updateDomainObject(newDomainObject) {
            this.domainObject = newDomainObject;
        },
        moveContainer(toIndex, event) {
            let containerId = event.dataTransfer.getData('containerid');
            let container = this.containers.filter(c => c.id === containerId)[0];
            let fromIndex = this.containers.indexOf(container);
            this.containers.splice(fromIndex, 1);
            if (fromIndex > toIndex) {
                this.containers.splice(toIndex + 1, 0, container);
            } else {
                this.containers.splice(toIndex, 0, container);
            }

            this.persist();
        },
        removeChildObject(identifier) {
            let removeIdentifier = this.openmct.objects.makeKeyString(identifier);

            this.identifierMap[removeIdentifier] = undefined;
            delete this.identifierMap[removeIdentifier];

            this.containers.forEach(container => {
                container.frames = container.frames.filter(frame => {
                    let frameIdentifier = this.openmct.objects.makeKeyString(frame.domainObjectIdentifier);

                    return removeIdentifier !== frameIdentifier;
                });
            });

            this.persist();
        }
    }
};
</script>
