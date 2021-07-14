/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
<template>
<div
    class="c-conductor"
    :class="[
        isFixed ? 'is-fixed-mode' : 'is-realtime-mode'
    ]"
>
    <div v-if="timeOptions"
         class="c-conductor__time-bounds"
    >
        <ConductorModeIcon />
        <conductor-delta-input-fixed v-if="isFixed"
                                     :key-string="domainObject.identifier.key"
                                     :offsets="timeOptions.fixedOffsets"
                                     @updated="saveFixedOffets"
        />
        <conductor-delta-input-realtime v-else
                                        :key-string="domainObject.identifier.key"
                                        :realtime-offsets="timeOptions.clockOffsets"
                                        @updated="saveClockOffsets"
        />

    </div>
</div>
</template>

<script>
import ConductorDeltaInputFixed from "@/plugins/timeConductor/ConductorDeltaInputFixed.vue";
import ConductorDeltaInputRealtime from "@/plugins/timeConductor/ConductorDeltaInputRealtime.vue";
import ConductorModeIcon from "@/plugins/timeConductor/ConductorModeIcon.vue";

export default {
    components: {
        ConductorModeIcon,
        ConductorDeltaInputRealtime,
        ConductorDeltaInputFixed
    },
    inject: ['openmct', 'domainObject'],
    props: {
        options: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        return {
            isFixed: this.openmct.time.clock() === undefined,
            timeOptions: this.options || {
                clockOffsets: this.openmct.time.clockOffsets(),
                fixedOffsets: this.openmct.time.bounds()
            }
        };
    },
    watch: {
        options: {
            handler(newOptions) {
                if (this.timeOptions.start !== newOptions.start
                    || this.timeOptions.end !== newOptions.end) {
                    this.timeOptions = newOptions;
                    this.registerIndependentTimeOffsets();
                }
            },
            deep: true

        }
    },
    mounted() {
        this.openmct.time.on('clock', this.setViewFromClock);
        this.openmct.time.on('clockOffsets', this.setTimeOptions);
        this.registerIndependentTimeOffsets();
    },
    beforeDestroy() {
        this.openmct.time.off('clock', this.setViewFromClock);
        this.openmct.time.off('clockOffsets', this.setTimeOptions);
        this.destroyIndependentTime();
    },
    methods: {
        setViewFromClock(clock) {
            this.isFixed = clock === undefined;
            this.setTimeOptions();
        },
        setTimeOptions() {
            if (!this.timeOptions || !this.timeOptions.clockOffsets) {
                this.timeOptions = {
                    clockOffsets: this.openmct.time.clockOffsets(),
                    fixedOffsets: this.openmct.time.bounds()
                };
            }

            this.registerIndependentTimeOffsets();
        },
        saveFixedOffets(offsets) {
            const newOptions = Object.assign({}, this.timeOptions, {
                fixedOffsets: offsets
            });
            this.updateTimeOptions(newOptions);
        },
        saveClockOffsets(offsets) {
            const newOptions = Object.assign({}, this.timeOptions, {
                clockOffsets: offsets
            });
            this.updateTimeOptions(newOptions);
        },
        updateTimeOptions(options) {
            this.timeOptions = options;
            this.registerIndependentTimeOffsets();
            this.$emit('updated', options);
        },
        registerIndependentTimeOffsets() {
            let offsets;

            if (this.isFixed) {
                offsets = this.timeOptions.fixedOffsets;
            } else {
                offsets = this.timeOptions.clockOffsets;
            }

            this.destroyIndependentTime();
            this.unregisterIndependentTime = this.openmct.time.registerIndependentTime(this.domainObject.identifier.key, offsets);
        },
        destroyIndependentTime() {
            if (this.unregisterIndependentTime) {
                this.unregisterIndependentTime.delete(this.domainObject.identifier.key);
            }
        }
    }
};
</script>
