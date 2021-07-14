<template>
<div
    class="pr-tc-input-menu"
    :class="{'pr-tc-input-menu--bottom' : bottom === true}"
    @keydown.enter.prevent
    @keyup.enter.prevent="submit"
    @keydown.esc.prevent
    @keyup.esc.prevent="hide"
    @click.stop
>
    <div class="pr-time-label__hrs">Hrs</div>
    <div class="pr-time-label__mins">Mins</div>
    <div class="pr-time-label__secs">Secs</div>

    <div class="pr-time-controls">
        <input
            ref="inputHrs"
            v-model="inputHrs"
            class="pr-time-controls__hrs"
            step="1"
            type="number"
            min="0"
            max="23"
            title="Enter 0 - 23"
            @change="validate()"
            @keyup="validate()"
            @focusin="selectAll($event)"
            @focusout="format('inputHrs')"
            @wheel="increment($event, 'inputHrs')"
        >
        :
    </div>
    <div class="pr-time-controls">
        <input
            ref="inputMins"
            v-model="inputMins"
            type="number"
            class="pr-time-controls__mins"
            min="0"
            max="59"
            title="Enter 0 - 59"
            step="1"
            @change="validate()"
            @keyup="validate()"
            @focusin="selectAll($event)"
            @focusout="format('inputMins')"
            @wheel="increment($event, 'inputMins')"
        >
        :
    </div>
    <div class="pr-time-controls">
        <input
            ref="inputSecs"
            v-model="inputSecs"
            type="number"
            class="pr-time-controls__secs"
            min="0"
            max="59"
            title="Enter 0 - 59"
            step="1"
            @change="validate()"
            @keyup="validate()"
            @focusin="selectAll($event)"
            @focusout="format('inputSecs')"
            @wheel="increment($event, 'inputSecs')"
        >
        <div class="pr-time__buttons">
            <button
                class="c-button c-button--major icon-check"
                :disabled="isDisabled"
                @click.prevent="submit"
            ></button>
            <button class="c-button icon-x"
                    @click.prevent="hide"
            ></button>
        </div>
    </div>
</div>
</template>

<script>

export default {
    props: {
        type: {
            type: String,
            required: true
        },
        offset: {
            type: String,
            required: true
        },
        bottom: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data() {
        return {
            inputHrs: '00',
            inputMins: '00',
            inputSecs: '00',
            isDisabled: false
        };
    },
    mounted() {
        this.setOffset();
        document.addEventListener('click', this.hide);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.hide);
    },
    methods: {
        format(ref) {
            const curVal = this[ref];
            this[ref] = curVal.padStart(2, '0');
        },
        validate() {
            let disabled = false;
            let refs = ['inputHrs', 'inputMins', 'inputSecs'];

            for (let ref of refs) {
                let min = Number(this.$refs[ref].min);
                let max = Number(this.$refs[ref].max);
                let value = Number(this.$refs[ref].value);

                if (value > max || value < min) {
                    disabled = true;
                    break;
                }
            }

            this.isDisabled = disabled;
        },
        submit() {
            this.$emit('update', {
                type: this.type,
                hours: this.inputHrs,
                minutes: this.inputMins,
                seconds: this.inputSecs
            });
        },
        hide() {
            this.$emit('hide');
        },
        increment($ev, ref) {
            $ev.preventDefault();
            const step = (ref === 'inputHrs') ? 1 : 5;
            const maxVal = (ref === 'inputHrs') ? 23 : 59;
            let cv = Math.round(parseInt(this[ref], 10) / step) * step;
            cv = Math.min(maxVal, Math.max(0, ($ev.deltaY < 0) ? cv + step : cv - step));
            this[ref] = cv.toString().padStart(2, '0');
            this.validate();
        },
        setOffset() {
            [this.inputHrs, this.inputMins, this.inputSecs] = this.offset.split(':');
            this.numberSelect('inputHrs');
        },
        numberSelect(input) {
            this.$refs[input].focus();

            // change to text, select, then change back to number
            // number inputs do not support select()
            this.$nextTick(() => {
                this.$refs[input].setAttribute('type', 'text');
                this.$refs[input].select();

                this.$nextTick(() => {
                    this.$refs[input].setAttribute('type', 'number');
                });
            });
        },
        selectAll($ev) {
            $ev.target.select();
        }
    }
};
</script>
