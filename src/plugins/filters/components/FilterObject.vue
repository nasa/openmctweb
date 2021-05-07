<template>
<li class="c-tree__item-h">
    <div
        class="c-tree__item menus-to-left"
        @click="toggleExpanded"
    >
        <div
            class="c-filter-tree-item__filter-indicator"
            :class="{'icon-filter': hasActiveFilters }"
        ></div>
        <span
            class="c-disclosure-triangle is-enabled flex-elem"
            :class="{'c-disclosure-triangle--expanded': expanded}"
        ></span>
        <div class="c-tree__item__label c-object-label">
            <div class="c-object-label">
                <div
                    class="c-object-label__type-icon"
                    :class="objectCssClass"
                ></div>
                <div class="c-object-label__name flex-elem grows">
                    {{ filterObject.name }}
                </div>
            </div>
        </div>
    </div>

    <div v-if="expanded">
        <ul class="c-inspect-properties">
            <div
                v-if="!isEditing && persistedFilters.useGlobal"
                class="c-inspect-properties__label span-all"
            >
                Uses global filter
            </div>

            <div
                v-if="isEditing"
                class="c-inspect-properties__label span-all"
            >
                <toggle-switch
                    :id="keyString"
                    :checked="persistedFilters.useGlobal"
                    @change="useGlobalFilter"
                />
                Use global filter
            </div>
            <filter-field
                v-for="metadatum in activeFilters"
                :key="metadatum.key"
                :filter-field="metadatum"
                :use-global="persistedFilters.useGlobal"
                :persisted-filters="updatedFilters[metadatum.key]"
                @filterSelected="updateFiltersWithSelectedValue"
                @filterTextValueChanged="updateFiltersWithTextValue"
            />
        </ul>
    </div>
</li>
</template>

<script>
import FilterField from './FilterField.vue';
import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';
import isEmpty from 'lodash/isEmpty';

export default {
    components: {
        FilterField,
        ToggleSwitch
    },
    inject: ['openmct'],
    props: {
        filterObject: {
            type: Object,
            required: true
        },
        persistedFilters: {
            type: Object,
            default: () => {
                return {};
            }
        }
    },
    data() {
        return {
            expanded: false,
            objectCssClass: undefined,
            updatedFilters: JSON.parse(JSON.stringify(this.persistedFilters)),
            isEditing: this.openmct.editor.isEditing()
        };
    },
    computed: {
        // do not show filter fields if using global filter
        // if editing however, show all filter fields
        activeFilters() {
            if (!this.isEditing && this.persistedFilters.useGlobal) {
                return [];
            }

            return this.filterObject.metadataWithFilters;
        },
        hasActiveFilters() {
            // Should be true when the user has entered any filter values.
            return Object.values(this.persistedFilters).some(comparator => {
                return (typeof (comparator) === 'object' && !isEmpty(comparator));
            });
        }
    },
    watch: {
        persistedFilters: {
            handler: function checkFilters(newpersistedFilters) {
                this.updatedFilters = JSON.parse(JSON.stringify(newpersistedFilters));
            },
            deep: true
        }
    },
    mounted() {
        let type = this.openmct.types.get(this.filterObject.domainObject.type) || {};
        this.keyString = this.openmct.objects.makeKeyString(this.filterObject.domainObject.identifier);
        this.objectCssClass = type.definition.cssClass;
        this.openmct.editor.on('isEditing', this.toggleIsEditing);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.toggleIsEditing);
    },
    methods: {
        toggleExpanded() {
            this.expanded = !this.expanded;
        },
        updateFiltersWithSelectedValue(key, comparator, valueName, value) {
            let filterValue = this.updatedFilters[key];

            if (filterValue[comparator]) {
                if (value === true) {
                    filterValue[comparator].push(valueName);
                } else {
                    if (filterValue[comparator].length === 1) {
                        this.$set(this.updatedFilters, key, {});
                    } else {
                        filterValue[comparator] = filterValue[comparator].filter(v => v !== valueName);
                    }
                }
            } else {
                this.$set(this.updatedFilters[key], comparator, [valueName]);
            }

            this.$emit('updateFilters', this.keyString, this.updatedFilters);
        },
        updateFiltersWithTextValue(key, comparator, value) {
            if (value.trim() === '') {
                this.$set(this.updatedFilters, key, {});
            } else {
                this.$set(this.updatedFilters[key], comparator, value);
            }

            this.$emit('updateFilters', this.keyString, this.updatedFilters);
        },
        useGlobalFilter(checked) {
            this.updatedFilters.useGlobal = checked;
            this.$emit('updateFilters', this.keyString, this.updatedFilters, checked);
        },
        toggleIsEditing(isEditing) {
            this.isEditing = isEditing;
        }
    }
};
</script>
