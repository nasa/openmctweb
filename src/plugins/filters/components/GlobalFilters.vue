<template>
<li class="c-tree__item-h">
    <div
        class="c-tree__item menus-to-left"
        @click="toggleExpanded"
    >
        <div
            class="c-filter-tree-item__filter-indicator"
            :class="{'icon-filter': hasActiveGlobalFilters }"
        ></div>
        <span
            class="c-disclosure-triangle is-enabled flex-elem"
            :class="{'c-disclosure-triangle--expanded': expanded}"
        ></span>
        <div class="c-tree__item__label c-object-label">
            <div class="c-object-label">
                <div class="c-object-label__type-icon icon-gear"></div>
                <div class="c-object-label__name flex-elem grows">
                    Global Filtering
                </div>
            </div>
        </div>
    </div>
    <ul
        v-if="expanded"
        class="c-inspect-properties"
    >
        <filter-field
            v-for="metadatum in globalMetadata"
            :key="metadatum.key"
            :filter-field="metadatum"
            :persisted-filters="updatedFilters[metadatum.key]"
            @filterSelected="updateFiltersWithSelectedValue"
            @filterTextValueChanged="updateFiltersWithTextValue"
        />
    </ul>
</li>
</template>

<script>
import FilterField from './FilterField.vue';

export default {
    components: {
        FilterField
    },
    inject: ['openmct'],
    props: {
        globalMetadata: {
            type: Object,
            required: true
        },
        globalFilters: {
            type: Object,
            default: () => {
                return {};
            }
        }
    },
    data() {
        return {
            expanded: false,
            updatedFilters: JSON.parse(JSON.stringify(this.globalFilters))
        };
    },
    computed: {
        hasActiveGlobalFilters() {
            return Object.values(this.globalFilters).some(field => {
                return Object.values(field).some(comparator => {
                    return (comparator && (comparator !== '' || comparator.length > 0));
                });
            });
        }
    },
    watch: {
        globalFilters: {
            handler: function checkFilters(newGlobalFilters) {
                this.updatedFilters = JSON.parse(JSON.stringify(newGlobalFilters));
            },
            deep: true
        }
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

            this.$emit('persistGlobalFilters', key, this.updatedFilters);
        },
        updateFiltersWithTextValue(key, comparator, value) {
            if (value.trim() === '') {
                this.$set(this.updatedFilters, key, {});
            } else {
                this.$set(this.updatedFilters[key], comparator, value);
            }

            this.$emit('persistGlobalFilters', key, this.updatedFilters);
        }
    }
};
</script>
