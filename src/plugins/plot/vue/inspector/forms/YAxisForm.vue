<template>
<div>
    <ul class="l-inspector-part">
        <h2>Y Axis</h2>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Manually override how the Y axis is labeled."
            >Label</div>
            <div class="grid-cell value"><input v-model="label"
                                                class="c-input--flex"
                                                type="text"
                                                @change="updateForm('label')"
            ></div>
        </li>
    </ul>
    <ul class="l-inspector-part">
        <h2>Y Axis Scaling</h2>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Automatically scale the Y axis to keep all values in view."
            >Auto scale</div>
            <div class="grid-cell value"><input v-model="autoscale"
                                                type="checkbox"
                                                @change="updateForm('autoscale')"
            ></div>
        </li>
        <li v-show="autoscale"
            class="grid-row"
        >
            <div class="grid-cell label"
                 title="Percentage of padding above and below plotted min and max values. 0.1, 1.0, etc."
            >
                Padding</div>
            <div class="grid-cell value">
                <input v-model="autoscalePadding"
                       class="c-input--flex"
                       type="text"
                       @change="updateForm('autoscalePadding')"
                >
            </div>
        </li>
    </ul>
    <ul v-show="!autoscale"
        class="l-inspector-part"
    >
        <div v-show="!autoscale && validation.range"
             class="grid-span-all form-error"
        >
            {{ validation.range }}
        </div>
        <li class="grid-row force-border">
            <div class="grid-cell label"
                 title="Minimum Y axis value."
            >Minimum Value</div>
            <div class="grid-cell value">
                <input v-model="rangeMin"
                       class="c-input--flex"
                       type="number"
                       @change="updateForm('range')"
                >
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Maximum Y axis value."
            >Maximum Value</div>
            <div class="grid-cell value"><input v-model="rangeMax"
                                                class="c-input--flex"
                                                type="number"
                                                @change="updateForm('range')"
            ></div>
        </li>
    </ul>
</div>
</template>

<script>
import { objectPath, validate, coerce } from "./formUtil";
import _ from "lodash";

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        yAxis: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            label: '',
            autoscale: '',
            autoscalePadding: '',
            rangeMin: '',
            rangeMax: '',
            validation: {}
        };
    },
    mounted() {
        this.initialize();
        this.initFormValues();
    },
    methods: {
        initialize: function () {
            this.fields = [
                {
                    modelProp: 'label',
                    objectPath: 'configuration.yAxis.label'
                },
                {
                    modelProp: 'autoscale',
                    coerce: Boolean,
                    objectPath: 'configuration.yAxis.autoscale'
                },
                {
                    modelProp: 'autoscalePadding',
                    coerce: Number,
                    objectPath: 'configuration.yAxis.autoscalePadding'
                },
                {
                    modelProp: 'range',
                    objectPath: 'configuration.yAxis.range',
                    coerce: function coerceRange(range) {
                        if (!range) {
                            return {
                                min: 0,
                                max: 0
                            };
                        }

                        const newRange = {};
                        if (typeof range.min !== 'undefined' && range.min !== null) {
                            newRange.min = Number(range.min);
                        }

                        if (typeof range.max !== 'undefined' && range.max !== null) {
                            newRange.max = Number(range.max);
                        }

                        return newRange;
                    },
                    validate: function validateRange(range, model) {
                        if (!range) {
                            return 'Need range';
                        }

                        if (range.min === '' || range.min === null || typeof range.min === 'undefined') {
                            return 'Must specify Minimum';
                        }

                        if (range.max === '' || range.max === null || typeof range.max === 'undefined') {
                            return 'Must specify Maximum';
                        }

                        if (Number.isNaN(Number(range.min))) {
                            return 'Minimum must be a number.';
                        }

                        if (Number.isNaN(Number(range.max))) {
                            return 'Maximum must be a number.';
                        }

                        if (Number(range.min) > Number(range.max)) {
                            return 'Minimum must be less than Maximum.';
                        }

                        if (model.get('autoscale')) {
                            return false;
                        }

                        return true;
                    }
                }
            ];
        },
        initFormValues() {
            this.label = this.yAxis.get('label');
            this.autoscale = this.yAxis.get('autoscale');
            this.autoscalePadding = this.yAxis.get('autoscalePadding');
            const range = this.yAxis.get('range');
            if (range) {
                this.rangeMin = range.min;
                this.rangeMax = range.max;
            }
        },
        updateForm(formKey) {
            let newVal;
            if (formKey === 'range') {
                newVal = {
                    min: this.rangeMin,
                    max: this.rangeMax
                };
            } else {
                newVal = this[formKey];
            }

            const oldVal = this.yAxis.get(formKey);
            const formField = this.fields.find((field) => field.modelProp === formKey);

            const path = objectPath(formField.objectPath);
            const validationResult = validate(newVal, this.yAxis, formField.validate);
            if (validationResult === true) {
                delete this.validation[formKey];
            } else {
                this.validation[formKey] = validationResult;

                return;
            }

            if (!_.isEqual(coerce(newVal, formField.coerce), coerce(oldVal, formField.coerce))) {
                this.yAxis.set(formKey, coerce(newVal, formField.coerce));
                if (path) {
                    this.openmct.objects.mutate(
                        this.domainObject,
                        path(this.domainObject, this.yAxis),
                        coerce(newVal, formField.coerce)
                    );
                }
            }
        }
    }
};

</script>
