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
        { 'is-zooming': isZooming },
        { 'is-panning': isPanning },
        { 'alt-pressed': altPressed },
        isFixed ? 'is-fixed-mode' : 'is-realtime-mode'
    ]"
>
    <div class="c-conductor__time-bounds">
        <conductor-delta-input-fixed v-if="isFixed"
                                     @updated="saveFixedOffsets"
        />
        <conductor-delta-input-realtime v-else
                                        @updated="saveClockOffsets"
        />
        <ConductorModeIcon class="c-conductor__mode-icon" />
        <conductor-axis
            class="c-conductor__ticks"
            :view-bounds="viewBounds"
            :is-fixed="isFixed"
            :alt-pressed="altPressed"
            @endPan="endPan"
            @endZoom="endZoom"
            @panAxis="pan"
            @zoomAxis="zoom"
        />

    </div>
    <div class="c-conductor__controls">
        <ConductorMode class="c-conductor__mode-select" />
        <ConductorTimeSystem class="c-conductor__time-system-select" />
        <ConductorHistory
            class="c-conductor__history-select"
            :offsets="openmct.time.clockOffsets()"
            :bounds="bounds"
            :time-system="timeSystem"
            :mode="timeMode"
        />
    </div>
</div>
</template>

<script>
import _ from 'lodash';
import ConductorMode from './ConductorMode.vue';
import ConductorTimeSystem from './ConductorTimeSystem.vue';
import ConductorAxis from './ConductorAxis.vue';
import ConductorModeIcon from './ConductorModeIcon.vue';
import ConductorHistory from './ConductorHistory.vue';
import ConductorDeltaInputFixed from "@/plugins/timeConductor/ConductorDeltaInputFixed.vue";
import ConductorDeltaInputRealtime from "@/plugins/timeConductor/ConductorDeltaInputRealtime.vue";

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    components: {
        ConductorDeltaInputRealtime,
        ConductorDeltaInputFixed,
        ConductorMode,
        ConductorTimeSystem,
        ConductorAxis,
        ConductorModeIcon,
        ConductorHistory
    },
    inject: ['openmct', 'configuration'],
    data() {
        let bounds = this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();
        let timeSystem = this.openmct.time.timeSystem();
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);

        return {
            timeSystem: timeSystem,
            timeFormatter: timeFormatter,
            durationFormatter: durationFormatter,
            offsets: {
                start: offsets && durationFormatter.format(Math.abs(offsets.start)),
                end: offsets && durationFormatter.format(Math.abs(offsets.end))
            },
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            formattedBounds: {
                start: timeFormatter.format(bounds.start),
                end: timeFormatter.format(bounds.end)
            },
            viewBounds: {
                start: bounds.start,
                end: bounds.end
            },
            isFixed: this.openmct.time.clock() === undefined,
            isUTCBased: timeSystem.isUTCBased,
            showDatePicker: false,
            altPressed: false,
            isPanning: false,
            isZooming: false,
            showTCInputStart: false,
            showTCInputEnd: false
        };
    },
    computed: {
        timeMode() {
            return this.isFixed ? 'fixed' : 'realtime';
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));
        this.openmct.time.on('bounds', _.throttle(this.handleNewBounds, 300));
        this.openmct.time.on('timeSystem', this.setTimeSystem);
        this.openmct.time.on('clock', this.setViewFromClock);
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    },
    methods: {
        handleNewBounds(bounds) {
            this.setBounds(bounds);
            this.setViewFromBounds(bounds);
        },
        setBounds(bounds) {
            this.bounds = bounds;
        },
        handleKeyDown(event) {
            if (event.key === 'Alt') {
                this.altPressed = true;
            }
        },
        handleKeyUp(event) {
            if (event.key === 'Alt') {
                this.altPressed = false;
            }
        },
        pan(bounds) {
            this.isPanning = true;
            this.setViewFromBounds(bounds);
        },
        endPan(bounds) {
            this.isPanning = false;
            if (bounds) {
                this.openmct.time.bounds(bounds);
            }
        },
        zoom(bounds) {
            this.isZooming = true;
            this.formattedBounds.start = this.timeFormatter.format(bounds.start);
            this.formattedBounds.end = this.timeFormatter.format(bounds.end);
        },
        endZoom(bounds) {
            this.isZooming = false;

            if (bounds) {
                this.openmct.time.bounds(bounds);
            } else {
                this.setViewFromBounds(this.bounds);
            }
        },
        setTimeSystem(timeSystem) {
            this.timeSystem = timeSystem;
            this.timeFormatter = this.getFormatter(timeSystem.timeFormat);
            this.durationFormatter = this.getFormatter(
                timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            this.isUTCBased = timeSystem.isUTCBased;
        },
        setViewFromClock(clock) {
            // this.clearAllValidation();
            this.isFixed = clock === undefined;
        },
        setViewFromBounds(bounds) {
            this.formattedBounds.start = this.timeFormatter.format(bounds.start);
            this.formattedBounds.end = this.timeFormatter.format(bounds.end);
            this.viewBounds.start = bounds.start;
            this.viewBounds.end = bounds.end;
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        saveClockOffsets(offsets) {
            this.openmct.time.clockOffsets(offsets);
        },
        saveFixedOffsets(bounds) {
            this.openmct.time.bounds(bounds);
        }
    }
};
</script>
