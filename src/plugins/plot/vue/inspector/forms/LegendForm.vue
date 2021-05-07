<template>
<div>
    <li class="grid-row">
        <div class="grid-cell label"
             title="The position of the legend relative to the plot display area."
        >Position</div>
        <div class="grid-cell value">
            <select v-model="position"
                    @change="updateForm('position')"
            >
                <option value="top">Top</option>
                <option value="right">Right</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
            </select>
        </div>
    </li>
    <li class="grid-row">
        <div class="grid-cell label"
             title="Hide the legend when the plot is small"
        >Hide when plot small</div>
        <div class="grid-cell value"><input v-model="hideLegendWhenSmall"
                                            type="checkbox"
                                            @change="updateForm('hideLegendWhenSmall')"
        ></div>
    </li>
    <li class="grid-row">
        <div class="grid-cell label"
             title="Show the legend expanded by default"
        >Expand by default</div>
        <div class="grid-cell value"><input v-model="expandByDefault"
                                            type="checkbox"
                                            @change="updateForm('expandByDefault')"
        ></div>
    </li>
    <li class="grid-row">
        <div class="grid-cell label"
             title="What to display in the legend when it's collapsed."
        >When collapsed show</div>
        <div class="grid-cell value">
            <select v-model="valueToShowWhenCollapsed"
                    @change="updateForm('valueToShowWhenCollapsed')"
            >
                <option value="none">Nothing</option>
                <option value="nearestTimestamp">Nearest timestamp</option>
                <option value="nearestValue">Nearest value</option>
                <option value="min">Minimum value</option>
                <option value="max">Maximum value</option>
                <option value="units">Units</option>
            </select>
        </div>
    </li>
    <li class="grid-row">
        <div class="grid-cell label"
             title="What to display in the legend when it's expanded."
        >When expanded show</div>
        <div class="grid-cell value">
            <ul>
                <li><input v-model="showTimestampWhenExpanded"
                           type="checkbox"
                           @change="updateForm('showTimestampWhenExpanded')"
                > Nearest timestamp</li>
                <li><input v-model="showValueWhenExpanded"
                           type="checkbox"
                           @change="updateForm('showValueWhenExpanded')"
                > Nearest value</li>
                <li><input v-model="showMinimumWhenExpanded"
                           type="checkbox"
                           @change="updateForm('showMinimumWhenExpanded')"
                > Minimum value</li>
                <li><input v-model="showMaximumWhenExpanded"
                           type="checkbox"
                           @change="updateForm('showMaximumWhenExpanded')"
                > Maximum value</li>
                <li><input v-model="showUnitsWhenExpanded"
                           type="checkbox"
                           @change="updateForm('showUnitsWhenExpanded')"
                > Units</li>
            </ul>

        </div>
    </li>
</div>
</template>
<script>
import {coerce, objectPath, validate} from "@/plugins/plot/vue/inspector/forms/formUtil";
import _ from "lodash";

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        legend: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            position: '',
            hideLegendWhenSmall: '',
            expandByDefault: '',
            valueToShowWhenCollapsed: '',
            showTimestampWhenExpanded: '',
            showValueWhenExpanded: '',
            showMinimumWhenExpanded: '',
            showMaximumWhenExpanded: '',
            showUnitsWhenExpanded: '',
            validation: {}
        };
    },
    mounted() {
        this.initialize();
        this.initFormValues();
    },
    methods: {
        initialize() {
            this.fields = [
                {
                    modelProp: 'position',
                    objectPath: 'configuration.legend.position'
                },
                {
                    modelProp: 'hideLegendWhenSmall',
                    coerce: Boolean,
                    objectPath: 'configuration.legend.hideLegendWhenSmall'
                },
                {
                    modelProp: 'expandByDefault',
                    coerce: Boolean,
                    objectPath: 'configuration.legend.expandByDefault'
                },
                {
                    modelProp: 'valueToShowWhenCollapsed',
                    objectPath: 'configuration.legend.valueToShowWhenCollapsed'
                },
                {
                    modelProp: 'showValueWhenExpanded',
                    coerce: Boolean,
                    objectPath: 'configuration.legend.showValueWhenExpanded'
                },
                {
                    modelProp: 'showTimestampWhenExpanded',
                    coerce: Boolean,
                    objectPath: 'configuration.legend.showTimestampWhenExpanded'
                },
                {
                    modelProp: 'showMaximumWhenExpanded',
                    coerce: Boolean,
                    objectPath: 'configuration.legend.showMaximumWhenExpanded'
                },
                {
                    modelProp: 'showMinimumWhenExpanded',
                    coerce: Boolean,
                    objectPath: 'configuration.legend.showMinimumWhenExpanded'
                },
                {
                    modelProp: 'showUnitsWhenExpanded',
                    coerce: Boolean,
                    objectPath: 'configuration.legend.showUnitsWhenExpanded'
                }
            ];
        },
        initFormValues() {
            this.position = this.legend.get('position');
            this.hideLegendWhenSmall = this.legend.get('hideLegendWhenSmall');
            this.expandByDefault = this.legend.get('expandByDefault');
            this.valueToShowWhenCollapsed = this.legend.get('valueToShowWhenCollapsed');
            this.showTimestampWhenExpanded = this.legend.get('showTimestampWhenExpanded');
            this.showValueWhenExpanded = this.legend.get('showValueWhenExpanded');
            this.showMinimumWhenExpanded = this.legend.get('showMinimumWhenExpanded');
            this.showMaximumWhenExpanded = this.legend.get('showMaximumWhenExpanded');
            this.showUnitsWhenExpanded = this.legend.get('showUnitsWhenExpanded');
        },
        updateForm(formKey) {
            const newVal = this[formKey];
            const oldVal = this.legend.get(formKey);
            const formField = this.fields.find((field) => field.modelProp === formKey);

            const path = objectPath(formField.objectPath);
            const validationResult = validate(newVal, this.legend, formField.validate);
            if (validationResult === true) {
                delete this.validation[formKey];
            } else {
                this.validation[formKey] = validationResult;

                return;
            }

            if (!_.isEqual(coerce(newVal, formField.coerce), coerce(oldVal, formField.coerce))) {
                this.legend.set(formKey, coerce(newVal, formField.coerce));
                if (path) {
                    this.openmct.objects.mutate(
                        this.domainObject,
                        path(this.domainObject, this.legend),
                        coerce(newVal, formField.coerce)
                    );
                }
            }
        },
        setStatus(status) {
            this.status = status;
        }
    }
};
</script>
