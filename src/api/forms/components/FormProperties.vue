<template>
<div>
    <form name="mctForm"
      class="form c-form mct-form"
      autocomplete="off"
      @submit.prevent
    >
        <div class="mct-form__title c-overlay__top-bar">
            <div class="c-overlay__dialog-title">{{ model.title }}</div>
            <div class="c-overlay__dialog-hint hint">All fields marked <span class="req icon-asterisk"></span> are required.</div>
        </div>
        <span v-for="section in model.sections"
            :key="section.name"
            class="mct-form__sections l-form-section c-form__section"
            :class="section.cssClass"
        >
            <h2 class="c-form__header"
                v-if="section.name"
            >
                {{ section.name }}
            </h2>
            <div v-for="(row, index) in section.rows"
                :key="row.name"
            >
                <FormRow :css-class="section.cssClass"
                        :first="index < 1"
                        :row="row"
                        @onChange="onChange"
                />
            </div>
        </span>
    </form>

    <div class="mct-form__controls c-overlay__button-bar">
    <button tabindex="0"
        :disabled="isInvalid"
            class="c-button c-button--major"
            @click="onSave"
    >
        OK
    </button>
    <button tabindex="0"
            class="c-button"
            @click="onDismiss"
    >
        Cancel
    </button>
    </div>
</div>
</template>

<script>
import FormRow from "@/api/forms/components/FormRow.vue";
export default {
    components: {
        FormRow
    },
    inject: ['openmct', 'domainObject'],
    props: {
        model: {
            type: Object,
            required: true
        },
        value: {
            type: Object,
            required: false,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            inValidProperties: {}
        };
    },
    computed: {
        isInvalid() {
            return Object.entries(this.inValidProperties)
                .some(([key, value]) => {
                    return value;
                });
        }
    },
    methods: {
        onChange(data) {
            this.$set(this.inValidProperties, data.model.key, data.invalid);

            this.$emit('onChange', data);
        },
        onDismiss() {
            this.$emit('onDismiss');
        },
        onSave() {
            this.$emit('onSave');
        }
    }
};
</script>
