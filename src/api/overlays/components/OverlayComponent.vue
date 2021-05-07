<template>
<div class="c-overlay">
    <div
        class="c-overlay__blocker"
        @click="destroy"
    ></div>
    <div class="c-overlay__outer">
        <button
            v-if="dismissable"
            class="c-click-icon c-overlay__close-button icon-x"
            @click="destroy"
        ></button>
        <div
            ref="element"
            class="c-overlay__contents"
            tabindex="0"
        ></div>
        <div
            v-if="buttons"
            class="c-overlay__button-bar"
        >
            <button
                v-for="(button, index) in buttons"
                ref="buttons"
                :key="index"
                class="c-button"
                tabindex="0"
                :class="{'c-button--major': focusIndex===index}"
                @focus="focusIndex=index"
                @click="buttonClickHandler(button.callback)"
            >
                {{ button.label }}
            </button>
        </div>
    </div>
</div>
</template>

<script>
export default {
    inject: ['dismiss', 'element', 'buttons', 'dismissable'],
    data: function () {
        return {
            focusIndex: -1
        };
    },
    mounted() {
        const element = this.$refs.element;
        element.appendChild(this.element);
        const elementForFocus = this.getElementForFocus() || element;
        this.$nextTick(() => {
            elementForFocus.focus();
        });
    },
    methods: {
        destroy: function () {
            if (this.dismissable) {
                this.dismiss();
            }
        },
        buttonClickHandler: function (method) {
            method();
            this.$emit('destroy');
        },
        getElementForFocus: function () {
            const defaultElement = this.$refs.element;
            if (!this.$refs.buttons) {
                return defaultElement;
            }

            const focusButton = this.$refs.buttons.filter((button, index) => {
                if (this.buttons[index].emphasis) {
                    this.focusIndex = index;
                }

                return this.buttons[index].emphasis;
            });

            if (!focusButton.length) {
                return defaultElement;
            }

            return focusButton[0];
        }
    }
};
</script>
