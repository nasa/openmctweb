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
    <form
        ref="conductorForm"
        class="u-contents"
        @submit.prevent="updateTimeFromConductor"
    >
        <div class="c-conductor__time-bounds">
            <button
                ref="submitButton"
                class="c-input--submit"
                type="submit"
            ></button>
            <ConductorModeIcon class="c-conductor__mode-icon" />

            <div
                v-if="isFixed"
                class="c-ctrl-wrapper c-conductor-input c-conductor__start-fixed"
            >
                <!-- Fixed start -->
                <div class="c-conductor__start-fixed__label">
                    Start
                </div>
                <input
                    ref="startDate"
                    v-model="formattedBounds.start"
                    class="c-input--datetime"
                    type="text"
                    autocorrect="off"
                    spellcheck="false"
                    @change="validateAllBounds('startDate'); submitForm()"
                >
                <date-picker
                    v-if="isFixed && isUTCBased"
                    :default-date-time="formattedBounds.start"
                    :formatter="timeFormatter"
                    @date-selected="startDateSelected"
                />
            </div>

            <div
                v-if="!isFixed"
                class="c-ctrl-wrapper c-conductor-input c-conductor__start-delta"
            >
                <!-- RT start -->
                <div class="c-direction-indicator icon-minus"></div>
                <input
                    ref="startOffset"
                    v-model="offsets.start"
                    class="c-input--hrs-min-sec"
                    type="text"
                    autocorrect="off"
                    spellcheck="false"
                    @change="validateAllOffsets(); submitForm()"
                >
            </div>

            <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-fixed">
                <!-- Fixed end and RT 'last update' display -->
                <div class="c-conductor__end-fixed__label">
                    {{ isFixed ? 'End' : 'Updated' }}
                </div>
                <input
                    ref="endDate"
                    v-model="formattedBounds.end"
                    class="c-input--datetime"
                    type="text"
                    autocorrect="off"
                    spellcheck="false"
                    :disabled="!isFixed"
                    @change="validateAllBounds('endDate'); submitForm()"
                >
                <date-picker
                    v-if="isFixed && isUTCBased"
                    class="c-ctrl-wrapper--menus-left"
                    :default-date-time="formattedBounds.end"
                    :formatter="timeFormatter"
                    @date-selected="endDateSelected"
                />
            </div>

            <div
                v-if="!isFixed"
                class="c-ctrl-wrapper c-conductor-input c-conductor__end-delta"
            >
                <!-- RT end -->
                <div class="c-direction-indicator icon-plus"></div>
                <input
                    ref="endOffset"
                    v-model="offsets.end"
                    class="c-input--hrs-min-sec"
                    type="text"
                    autocorrect="off"
                    spellcheck="false"
                    @change="validateAllOffsets(); submitForm()"
                >
            </div>

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
        <input
            type="submit"
            class="invisible"
        >
    </form>
</div>
</template>

<script>
import _ from 'lodash';
import ConductorMode from './ConductorMode.vue';
import ConductorTimeSystem from './ConductorTimeSystem.vue';
import DatePicker from './DatePicker.vue';
import ConductorAxis from './ConductorAxis.vue';
import ConductorModeIcon from './ConductorModeIcon.vue';
import ConductorHistory from './ConductorHistory.vue';

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    components: {
        ConductorMode,
        ConductorTimeSystem,
        DatePicker,
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
            isZooming: false
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
        this.openmct.time.on('clockOffsets', this.setViewFromOffsets);
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
        setOffsetsFromView($event) {
            if (this.$refs.conductorForm.checkValidity()) {
                let startOffset = 0 - this.durationFormatter.parse(this.offsets.start);
                let endOffset = this.durationFormatter.parse(this.offsets.end);

                this.openmct.time.clockOffsets({
                    start: startOffset,
                    end: endOffset
                });
            }

            if ($event) {
                $event.preventDefault();

                return false;
            }
        },
        setBoundsFromView($event) {
            if (this.$refs.conductorForm.checkValidity()) {
                let start = this.timeFormatter.parse(this.formattedBounds.start);
                let end = this.timeFormatter.parse(this.formattedBounds.end);

                this.openmct.time.bounds({
                    start: start,
                    end: end
                });
            }

            if ($event) {
                $event.preventDefault();

                return false;
            }
        },
        setViewFromClock(clock) {
            this.clearAllValidation();
            this.isFixed = clock === undefined;
        },
        setViewFromBounds(bounds) {
            this.formattedBounds.start = this.timeFormatter.format(bounds.start);
            this.formattedBounds.end = this.timeFormatter.format(bounds.end);
            this.viewBounds.start = bounds.start;
            this.viewBounds.end = bounds.end;
        },
        setViewFromOffsets(offsets) {
            this.offsets.start = this.durationFormatter.format(Math.abs(offsets.start));
            this.offsets.end = this.durationFormatter.format(Math.abs(offsets.end));
        },
        updateTimeFromConductor() {
            if (this.isFixed) {
                this.setBoundsFromView();
            } else {
                this.setOffsetsFromView();
            }
        },
        getBoundsLimit() {
            const configuration = this.configuration.menuOptions
                .filter(option => option.timeSystem === this.timeSystem.key)
                .find(option => option.limit);

            const limit = configuration ? configuration.limit : undefined;

            return limit;
        },
        clearAllValidation() {
            if (this.isFixed) {
                [this.$refs.startDate, this.$refs.endDate].forEach(this.clearValidationForInput);
            } else {
                [this.$refs.startOffset, this.$refs.endOffset].forEach(this.clearValidationForInput);
            }
        },
        clearValidationForInput(input) {
            input.setCustomValidity('');
            input.title = '';
        },
        validateAllBounds(ref) {
            if (!this.areBoundsFormatsValid()) {
                return false;
            }

            let validationResult = true;
            const currentInput = this.$refs[ref];

            return [this.$refs.startDate, this.$refs.endDate].every((input) => {
                let boundsValues = {
                    start: this.timeFormatter.parse(this.formattedBounds.start),
                    end: this.timeFormatter.parse(this.formattedBounds.end)
                };
                const limit = this.getBoundsLimit();

                if (
                    this.timeSystem.isUTCBased
                    && limit
                    && boundsValues.end - boundsValues.start > limit
                ) {
                    if (input === currentInput) {
                        validationResult = "Start and end difference exceeds allowable limit";
                    }
                } else {
                    if (input === currentInput) {
                        validationResult = this.openmct.time.validateBounds(boundsValues);
                    }
                }

                return this.handleValidationResults(input, validationResult);
            });
        },
        areBoundsFormatsValid() {
            let validationResult = true;

            return [this.$refs.startDate, this.$refs.endDate].every((input) => {
                const formattedDate = input === this.$refs.startDate
                    ? this.formattedBounds.start
                    : this.formattedBounds.end
                ;

                if (!this.timeFormatter.validate(formattedDate)) {
                    validationResult = 'Invalid date';
                }

                return this.handleValidationResults(input, validationResult);
            });
        },
        validateAllOffsets(event) {
            return [this.$refs.startOffset, this.$refs.endOffset].every((input) => {
                let validationResult = true;
                let formattedOffset;

                if (input === this.$refs.startOffset) {
                    formattedOffset = this.offsets.start;
                } else {
                    formattedOffset = this.offsets.end;
                }

                if (!this.durationFormatter.validate(formattedOffset)) {
                    validationResult = 'Offsets must be in the format hh:mm:ss and less than 24 hours in duration';
                } else {
                    let offsetValues = {
                        start: 0 - this.durationFormatter.parse(this.offsets.start),
                        end: this.durationFormatter.parse(this.offsets.end)
                    };
                    validationResult = this.openmct.time.validateOffsets(offsetValues);
                }

                return this.handleValidationResults(input, validationResult);
            });
        },
        handleValidationResults(input, validationResult) {
            if (validationResult !== true) {
                input.setCustomValidity(validationResult);
                input.title = validationResult;

                return false;
            } else {
                input.setCustomValidity('');
                input.title = '';

                return true;
            }
        },
        submitForm() {
            // Allow Vue model to catch up to user input.
            // Submitting form will cause validation messages to display (but only if triggered by button click)
            this.$nextTick(() => this.$refs.submitButton.click());
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        startDateSelected(date) {
            this.formattedBounds.start = this.timeFormatter.format(date);
            this.validateAllBounds('startDate');
            this.submitForm();
        },
        endDateSelected(date) {
            this.formattedBounds.end = this.timeFormatter.format(date);
            this.validateAllBounds('endDate');
            this.submitForm();
        }
    }
};
</script>
