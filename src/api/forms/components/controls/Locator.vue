<template>
    <ConditionSetSelectorDialog
        :hideTitle="true"
        :ignoreTypeCheck="true"
        :cssClass="`form-locator`"
        :parent="model.parent"
        @conditionSetSelected="handleItemSelection"
    />
</template>

<script>
import ConditionSetSelectorDialog from '@/plugins/condition/components/inspector/ConditionSetSelectorDialog.vue';

export default {
    components: {
        ConditionSetSelectorDialog
    },
    inject: ['openmct'],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
        };
    },
    computed: {

    },
    watch: {

    },
    mounted() {
        // remove following after css fix
        setTimeout(() => {
            document.querySelector('.c-overlay__contents-main').style.height = '200px';
        });
    },
    destroyed() {
    },
    methods: {
       handleItemSelection(parentDomainObject) {
           const data = { model: this.model, value: parentDomainObject };
           this.$emit('onChange', data);
       }
    }
};
</script>
