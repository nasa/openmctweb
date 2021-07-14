<template>
<form ref="fixedDeltaInput"
      class="u-contents"
      @submit.prevent="updateTimeFromConductor"
>
    <button
        ref="submitButton"
        class="c-input--submit"
        type="submit"
    ></button>
    <div
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
            v-if="isUTCBased"
            :bottom="offsets !== undefined"
            :default-date-time="formattedBounds.start"
            :formatter="timeFormatter"
            @date-selected="startDateSelected"
        />
    </div>
    <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-fixed">
        <!-- Fixed end and RT 'last update' display -->
        <div class="c-conductor__end-fixed__label">
            End
        </div>
        <input
            ref="endDate"
            v-model="formattedBounds.end"
            class="c-input--datetime"
            type="text"
            autocorrect="off"
            spellcheck="false"
            @change="validateAllBounds('endDate'); submitForm()"
        >
        <date-picker
            v-if="isUTCBased"
            class="c-ctrl-wrapper--menus-left"
            :bottom="offsets !== undefined"
            :default-date-time="formattedBounds.end"
            :formatter="timeFormatter"
            @date-selected="endDateSelected"
        />
    </div>
    <input
        type="submit"
        class="invisible"
    >
</form>
</template>

<script>

import DatePicker from "./DatePicker.vue";
import _ from "lodash";

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    components: {
        DatePicker
    },
    inject: ['openmct'],
    props: {
        keyString: {
            type: String,
            default() {
                return undefined;
            }
        },
        offsets: {
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

        return {
            showTCInputStart: true,
            showTCInputEnd: true,
            durationFormatter,
            timeFormatter,
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            formattedBounds: {
                start: timeFormatter.format(bounds.start),
                end: timeFormatter.format(bounds.end)
            },
            isUTCBased: timeSystem.isUTCBased
        };
    },
    watch: {
        offsets: {
            handler(newOffsets) {
                this.handleTimeSync(newOffsets);
            },
            deep: true
        }
    },
    mounted() {
        this.handleTimeSync(this.offsets);
        this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));
        this.openmct.time.on('bounds', _.throttle(this.handleNewBounds, 300));
        this.openmct.time.on('timeSystem', this.setTimeSystem);
        this.openmct.time.on('clock', this.clearAllValidation);
    },
    beforeDestroy() {
        this.openmct.time.off('bounds', _.throttle(this.handleNewBounds, 300));
        this.openmct.time.off('timeSystem', this.setTimeSystem);
        this.openmct.time.off('clock', this.clearAllValidation);
    },
    methods: {
        handleTimeSync(offsets) {
            if (offsets) {
                this.initializeIndependentTime(offsets);
            } else {
                this.syncTime();
            }
        },
        initializeIndependentTime(offsets) {
            if (offsets) {
                this.setBounds(offsets);
                this.setViewFromBounds(offsets);
            }
        },
        syncTime() {
            this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));
            this.handleNewBounds(this.openmct.time.bounds());
        },
        handleNewBounds(bounds) {
            if (!this.offsets) {
                this.setBounds(bounds);
                this.setViewFromBounds(bounds);
            }
        },
        clearAllValidation() {
            [this.$refs.startDate, this.$refs.endDate].forEach(this.clearValidationForInput);
        },
        clearValidationForInput(input) {
            input.setCustomValidity('');
            input.title = '';
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
        setBoundsFromView($event) {
            if (this.$refs.fixedDeltaInput.checkValidity()) {
                let start = this.timeFormatter.parse(this.formattedBounds.start);
                let end = this.timeFormatter.parse(this.formattedBounds.end);

                this.$emit('updated', {
                    start: start,
                    end: end
                });
            }

            if ($event) {
                $event.preventDefault();

                return false;
            }
        },
        submitForm() {
        // Allow Vue model to catch up to user input.
        // Submitting form will cause validation messages to display (but only if triggered by button click)
            this.$nextTick(() => this.$refs.submitButton.click());
        },
        updateTimeFromConductor() {
            this.setBoundsFromView();
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
                //TODO: Do we need limits here? We have conductor limits disabled right now
                // const limit = this.getBoundsLimit();
                const limit = false;

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
        getBoundsLimit() {
            const configuration = this.configuration.menuOptions
                .filter(option => option.timeSystem === this.timeSystem.key)
                .find(option => option.limit);

            const limit = configuration ? configuration.limit : undefined;

            return limit;
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
