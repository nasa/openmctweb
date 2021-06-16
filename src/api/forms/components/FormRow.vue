<template>
<div class="form-row c-form__row"
     :class="rowClass"
     @onChange="onChange"
>
    <div v-if="row.name"
         class="c-form__row__label label flex-elem"
         :title="row.description"
    >
        {{ row.name }}
    </div>
    <div class="c-form__row__controls controls flex-elem">
        <div v-if="row.control"
             class="c-form__controls-wrapper wrapper"
        >
            <component
                :is="getComponent"
                :key="row.key"
                :ref="`form-control-${row.key}`"
                :model="row"
                :value="row.value"
                :required="isRequired"
                @onChange="onChange"
            />
        </div>
    </div>
</div>
</template>

<script>
import AutoCompleteField from "@/api/forms/components/controls/AutoCompleteField.vue";
import Composite from "@/api/forms/components/controls/Composite.vue";
import FileInput from "@/api/forms/components/controls/FileInput.vue"
import Locator from "@/api/forms/components/controls/Locator.vue";
import NumberField from "@/api/forms/components/controls/NumberField.vue";
import SelectField from '@/api/forms/components/controls/SelectField.vue';
import TextArea from "@/api/forms/components/controls/TextArea.vue";
import TextField from "@/api/forms/components/controls/TextField.vue";

const CONTROL_TYPE_VIEW_MAP = {
    'autocomplete': AutoCompleteField,
    'composite': Composite,
    'file-input': FileInput,
    'locator': Locator,
    'numberfield': NumberField,
    'select': SelectField,
    'textarea': TextArea,
    'textfield': TextField,
};

export default {
    name: 'FormRow',
    components: CONTROL_TYPE_VIEW_MAP,
    inject: ['openmct', 'domainObject'],
    props: {
        cssClass: {
            type: String,
            default: '',
            required: true
        },
        first: {
            type: Boolean,
            default: false,
            required: true
        },
        row: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            valid: undefined,
            visited: false
        };
    },
    computed: {
        getComponent() {
            return CONTROL_TYPE_VIEW_MAP[this.row.control];
        },
        isRequired() {
            //TODO: Check if field is required
            return false;
        },
        rowClass() {
            let cssClass = this.cssClass;

            if (this.first === true) {
                cssClass = `${cssClass} first`;
            }

            if (this.row.required) {
                cssClass = `${cssClass} req`;
            }

            if (this.row.layout === 'controls-first') {
                cssClass = `${cssClass} l-controls-first`;
            }

            if (this.row.layout === 'controls-under') {
                cssClass = `${cssClass} l-controls-under`;
            }

            if (this.visited && this.valid !== undefined) {
                    if (this.valid === true) {
                    cssClass = `${cssClass} valid`;
                } else {
                    cssClass = `${cssClass} invalid`;
                }
            }

            return cssClass;
        }
    },
    mounted() {
        if (this.row.required) {
            const data = {
                model: this.row,
                value: this.row.value
            };

            this.onChange(data, false);
        }
    },
    methods: {
        onChange(data, visited = true) {
            this.visited = visited;

            const valid = this.validateRow(data);
            this.valid = valid;
            data.invalid = !valid;
            
            this.$emit('onChange', data);
        },
        validateRow(data) {
            let valid = true;
            if (this.row.required) {
                valid = data.value !== undefined && data.value !== null && data.value !== '';
            }

            const pattern = data.model.pattern;
            if (valid && pattern) {
                const regex = new RegExp(pattern);
                valid = regex.test(data.value);
            }

            const validate = data.model.validate;
            if (valid && validate) {
                valid = validate(this.domainObject, data);
            }

            return valid;
        }
    }
};
</script>
