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
<div ref="timelineHolder"
     class="c-timeline-holder"
>
    <div v-if="useIndependentTime"
         class="c-conductor l-shell__time-conductor"
    >
        <div class="c-conductor__time-bounds">
            <independent-time-conductor :options="timeOptions"
                                        @updated="saveTimeOptions"
            />
        </div>
    </div>
    <div class="c-timeline">
        <div v-for="timeSystemItem in timeSystems"
             :key="timeSystemItem.timeSystem.key"
             class="u-contents"
        >
            <swim-lane>
                <template slot="label">
                    {{ timeSystemItem.timeSystem.name }}
                </template>
                <template slot="object">
                    <timeline-axis :bounds="timeSystemItem.bounds"
                                   :time-system="timeSystemItem.timeSystem"
                                   :content-height="height"
                                   :rendering-engine="'svg'"
                    />
                </template>

            </swim-lane>
        </div>

        <div ref="contentHolder"
             class="u-contents c-timeline__objects c-timeline__content-holder"
        >
            <div
                v-for="item in items"
                :key="item.keyString"
                class="u-contents c-timeline__content"
            >
                <timeline-object-view
                    class="u-contents"
                    :item="item"
                />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import TimelineObjectView from './TimelineObjectView.vue';
import TimelineAxis from '../../ui/components/TimeSystemAxis.vue';
import SwimLane from "@/ui/components/swim-lane/SwimLane.vue";
import { getValidatedPlan } from "../plan/util";
import IndependentTimeConductor from "@/plugins/timeConductor/IndependentTimeConductor.vue";

const unknownObjectType = {
    definition: {
        cssClass: 'icon-object-unknown',
        name: 'Unknown Type'
    }
};

export default {
    components: {
        IndependentTimeConductor,
        TimelineObjectView,
        TimelineAxis,
        SwimLane
    },
    inject: ['openmct', 'domainObject', 'composition', 'objectPath'],
    data() {
        return {
            items: [],
            timeSystems: [],
            height: 0,
            useIndependentTime: this.domainObject.configuration ? this.domainObject.configuration.useIndependentTime : false,
            isFixed: this.openmct.time.clock() === undefined,
            timeOptions: this.domainObject.configuration ? this.domainObject.configuration.timeOptions : undefined
        };
    },
    beforeDestroy() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.reorder);
        this.openmct.time.off("bounds", this.updateViewBounds);
        if (this.unObserve) {
            this.unObserve();
        }

        if (this.unObserveTime) {
            this.unObserveTime();
        }
    },
    mounted() {
        if (this.composition) {
            this.composition.on('add', this.addItem);
            this.composition.on('remove', this.removeItem);
            this.composition.on('reorder', this.reorder);
            this.composition.load();
        }

        this.getTimeSystems();
        this.handleTimeSync(this.useIndependentTime);
        this.unObserveTime = this.openmct.objects.observe(this.domainObject, 'configuration.useIndependentTime', this.handleTimeSync);
    },
    methods: {
        addItem(domainObject) {
            let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
            let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            let objectPath = [domainObject].concat(this.objectPath.slice());
            let rowCount = 0;
            if (domainObject.type === 'plan') {
                rowCount = Object.keys(getValidatedPlan(domainObject)).length;
            }

            let height = domainObject.type === 'telemetry.plot.stacked' ? `${domainObject.composition.length * 100}px` : '100px';
            let item = {
                domainObject,
                objectPath,
                type,
                keyString,
                rowCount,
                height
            };

            this.items.push(item);
            this.updateContentHeight();
        },
        removeItem(identifier) {
            let index = this.items.findIndex(item => this.openmct.objects.areIdsEqual(identifier, item.domainObject.identifier));
            this.removeSelectable(this.items[index]);
            this.items.splice(index, 1);
        },
        reorder(reorderPlan) {
            let oldItems = this.items.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.items, reorderEvent.newIndex, oldItems[reorderEvent.oldIndex]);
            });
        },
        updateContentHeight() {
            this.height = Math.round(this.$refs.contentHolder.getBoundingClientRect().height);
        },
        getTimeSystems() {
            const timeSystems = this.openmct.time.getAllTimeSystems();
            timeSystems.forEach(timeSystem => {
                this.timeSystems.push({
                    timeSystem,
                    bounds: this.getBoundsForTimeSystem(timeSystem)
                });
            });
        },
        getBoundsForTimeSystem(timeSystem) {
            const currentBounds = this.openmct.time.bounds();

            //TODO: Some kind of translation via an offset? of current bounds to target timeSystem
            return currentBounds;
        },
        updateViewBounds(bounds) {
            let currentTimeSystem = this.timeSystems.find(item => item.timeSystem.key === this.openmct.time.timeSystem().key);
            if (currentTimeSystem) {
                currentTimeSystem.bounds = bounds;
            }
        },
        observeIndependentTime(event, bounds, isTick) {
            this.updateViewBounds(bounds);
        },
        handleTimeSync(useIndependentTime) {
            this.useIndependentTime = useIndependentTime;
            this.openmct.time.off('bounds', this.updateViewBounds);

            if (useIndependentTime) {
                const key = this.openmct.objects.makeKeyString(this.domainObject.identifier);
                this.updateViewBounds(this.openmct.time.getIndependentTime(key));
                if (this.unObserve) {
                    this.unObserve();
                }

                this.unObserve = this.openmct.time.observeIndependentTime(key, this.observeIndependentTime);
            } else {
                this.openmct.time.on('bounds', this.updateViewBounds);
            }
        },
        saveTimeOptions(options) {
            this.timeOptions = options;
            this.openmct.objects.mutate(this.domainObject, 'configuration.timeOptions', this.timeOptions);
        }
    }
};
</script>
