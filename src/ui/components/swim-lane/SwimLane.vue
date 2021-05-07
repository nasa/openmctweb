<template>
<div class="u-contents"
     :class="{'c-swimlane': !isNested}"
>

    <div class="c-swimlane__lane-label c-object-label"
         :class="{'c-swimlane__lane-label--span-cols': (!spanRowsCount && !isNested)}"
         :style="gridRowSpan"
    >
        <div v-if="iconClass"
             class="c-object-label__type-icon"
             :class="iconClass"
        >
        </div>

        <div class="c-object-label__name">
            <slot name="label"></slot>
        </div>

    </div>
    <div class="c-swimlane__lane-object"
         :style="{'min-height': minHeight}"
         :class="{'u-contents': showUcontents}"
    >
        <slot name="object"></slot>
    </div>
</div>

</template>

<script>
export default {
    props: {
        iconClass: {
            type: String,
            default() {
                return '';
            }
        },
        minHeight: {
            type: String,
            default() {
                return '';
            }
        },
        showUcontents: {
            type: Boolean,
            default() {
                return false;
            }
        },
        isNested: {
            type: Boolean,
            default() {
                return false;
            }
        },
        spanRowsCount: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    computed: {
        gridRowSpan() {
            if (this.spanRowsCount) {
                return `grid-row: span ${this.spanRowsCount}`;
            } else {
                return '';
            }
        }
    }
};
</script>
