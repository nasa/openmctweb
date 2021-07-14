<template>
<form ref="deltaInput"
      class="u-contents"
>
    <div
        class="c-ctrl-wrapper c-conductor-input c-conductor__start-delta"
    >
        <!-- RT start -->
        <div class="c-direction-indicator icon-minus"></div>
        <time-popup
            v-if="showTCInputStart"
            class="pr-tc-input-menu--start"
            :bottom="realtimeOffsets !== undefined"
            :type="'start'"
            :offset="offsets.start"
            @focus.native="$event.target.select()"
            @hide="hideAllTimePopups"
            @update="timePopUpdate"
        />
        <button
            ref="startOffset"
            class="c-button c-conductor__delta-button"
            @click="showTimePopupStart"
        >
            {{ offsets.start }}
        </button>
    </div>
    <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-fixed">
        <!-- RT 'last update' display -->
        <div class="c-conductor__end-fixed__label">
            Current
        </div>
        <input
            ref="endDate"
            v-model="formattedBounds.end"
            class="c-input--datetime"
            type="text"
            autocorrect="off"
            spellcheck="false"
            :disabled="true"
        >
    </div>
    <div
        class="c-ctrl-wrapper c-conductor-input c-conductor__end-delta"
    >
        <!-- RT end -->
        <div class="c-direction-indicator icon-plus"></div>
        <time-popup
            v-if="showTCInputEnd"
            class="pr-tc-input-menu--end"
            :bottom="realtimeOffsets !== undefined"
            :type="'end'"
            :offset="offsets.end"
            @focus.native="$event.target.select()"
            @hide="hideAllTimePopups"
            @update="timePopUpdate"
        />
        <button
            ref="endOffset"
            class="c-button c-conductor__delta-button"
            @click="showTimePopupEnd"
        >
            {{ offsets.end }}
        </button>
    </div>
</form>
</template>

<script>

import timePopup from "./timePopup.vue";
import _ from "lodash";

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    components: {
        timePopup
    },
    inject: ['openmct'],
    props: {
        keyString: {
            type: String,
            default() {
                return undefined;
            }
        },
        realtimeOffsets: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        let timeSystem = this.openmct.time.timeSystem();
        let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let bounds = this.bounds || this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();

        return {
            showTCInputStart: false,
            showTCInputEnd: false,
            durationFormatter,
            timeFormatter,
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            offsets: {
                start: offsets && durationFormatter.format(Math.abs(offsets.start)),
                end: offsets && durationFormatter.format(Math.abs(offsets.end))
            },
            formattedBounds: {
                start: timeFormatter.format(bounds.start),
                end: timeFormatter.format(bounds.end)
            },
            isUTCBased: timeSystem.isUTCBased
        };
    },
    watch: {
        realtimeOffsets: {
            handler(newOffsets) {
                this.handleTimeSync(newOffsets);
            },
            deep: true
        }
    },
    mounted() {
        this.handleTimeSync(this.realtimeOffsets);
        // this.followTime();
    },
    beforeDestroy() {
        this.destroy();
        this.stopFollowingTime();
    },
    methods: {
        followTime() {
            this.openmct.time.on('bounds', _.throttle(this.handleNewBounds, 300));
            this.openmct.time.on('timeSystem', this.setTimeSystem);
            this.openmct.time.on('clock', this.clearAllValidation);
            this.openmct.time.on('clockOffsets', this.setViewFromOffsets);
        },
        stopFollowingTime() {
            this.openmct.time.off('bounds', _.throttle(this.handleNewBounds, 300));
            this.openmct.time.off('timeSystem', this.setTimeSystem);
            this.openmct.time.off('clock', this.clearAllValidation);
            this.openmct.time.off('clockOffsets', this.setViewFromOffsets);
        },
        handleTimeSync(offsets) {
            if (offsets) {
                this.stopFollowingTime();
                this.initializeIndependentTime(offsets);
            } else {
                this.destroy();
                this.syncTime();
                this.followTime();
            }
        },
        destroy() {
            if (this.unObserve) {
                this.unObserve();
            }
        },
        initializeIndependentTime(offsets) {
            if (offsets) {
                this.setViewFromOffsets(offsets);
            }

            if (this.unObserve) {
                this.unObserve();
            }

            this.unObserve = this.openmct.time.observeIndependentTime(this.keyString, this.observeIndependentTime);

        },
        observeIndependentTime(event, bounds, isTick) {
            _.throttle(() => {
                this.handleNewBounds(bounds, isTick);
            }, 300);
        },
        syncTime() {
            this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));
            this.setViewFromOffsets(this.openmct.time.clockOffsets());
            this.handleNewBounds(this.openmct.time.bounds());
        },
        handleNewBounds(bounds) {
            this.setBounds(bounds);
            this.setViewFromBounds(bounds);
        },
        clearAllValidation() {
            [this.$refs.startOffset, this.$refs.endOffset].forEach(this.clearValidationForInput);
        },
        clearValidationForInput(input) {
            input.setCustomValidity('');
            input.title = '';
        },
        setViewFromOffsets(offsets) {
            this.offsets.start = this.durationFormatter.format(Math.abs(offsets.start));
            this.offsets.end = this.durationFormatter.format(Math.abs(offsets.end));
        },
        setBounds(bounds) {
            this.bounds = bounds;
        },
        setViewFromBounds(bounds) {
            this.formattedBounds.start = this.timeFormatter.format(bounds.start);
            this.formattedBounds.end = this.timeFormatter.format(bounds.end);
        },
        setTimeSystem(timeSystem) {
            this.timeSystem = timeSystem;
            this.timeFormatter = this.getFormatter(timeSystem.timeFormat);
            this.durationFormatter = this.getFormatter(
                timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            this.isUTCBased = timeSystem.isUTCBased;
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        hideAllTimePopups() {
            this.showTCInputStart = false;
            this.showTCInputEnd = false;
        },
        showTimePopupStart() {
            this.hideAllTimePopups();
            this.showTCInputStart = !this.showTCInputStart;
        },
        showTimePopupEnd() {
            this.hideAllTimePopups();
            this.showTCInputEnd = !this.showTCInputEnd;
        },
        timePopUpdate({ type, hours, minutes, seconds }) {
            this.offsets[type] = [hours, minutes, seconds].join(':');
            this.setOffsetsFromView();
            this.hideAllTimePopups();
        },
        setOffsetsFromView($event) {
            if (this.$refs.deltaInput.checkValidity()) {
                let startOffset = 0 - this.durationFormatter.parse(this.offsets.start);
                let endOffset = this.durationFormatter.parse(this.offsets.end);

                this.$emit('updated', {
                    start: startOffset,
                    end: endOffset
                });
            }

            if ($event) {
                $event.preventDefault();

                return false;
            }
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
        }
    }
};
</script>
