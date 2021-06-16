<template>
    <div class='form-control SelectField'>
        <select required="model.required"
                name="mctControl"
                @change="onChange($event)"
                v-model="selected"
        >
            <option v-for="option in model.options"
                :key="option.name"
                :value="option.value"
            >
                {{ option.name }}
            </option>
        </select>
    </div>
</template>

<script>
export default {
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            selected: this.model.value
        };
    },
    methods: {
        onChange() {
            const data = {
                model: this.model,
                value: this.selected
            };

            this.$emit('onChange', data);
        }
    }
};
</script>
