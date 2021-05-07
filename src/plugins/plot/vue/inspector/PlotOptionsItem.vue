<template>
<ul>
    <li class="c-tree__item menus-to-left">
        <span class="c-disclosure-triangle is-enabled flex-elem"
              :class="expandedCssClass"
              @click="toggleExpanded"
        >
        </span>
        <div class="c-object-label"
             :class="statusClass"
        >
            <div class="c-object-label__type-icon"
                 :class="getSeriesClass"
            >
                <span class="is-status__indicator"
                      title="This item is missing or suspect"
                ></span>
            </div>
            <div class="c-object-label__name">{{ series.domainObject.name }}</div>
        </div>
    </li>
    <li v-show="expanded"
        class="c-tree__item menus-to-left"
    >
        <ul class="grid-properties js-plot-options-browse-properties">
            <li class="grid-row">
                <div class="grid-cell label"
                     title="The field to be plotted as a value for this series."
                >Value</div>
                <div class="grid-cell value">
                    {{ yKey }}
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="The rendering method to join lines for this series."
                >Line Method</div>
                <div class="grid-cell value">{{ {
                    'none': 'None',
                    'linear': 'Linear interpolation',
                    'stepAfter': 'Step After'
                }[interpolate] }}
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Whether markers are displayed, and their size."
                >Markers</div>
                <div class="grid-cell value">
                    {{ markerOptionsDisplayText }}
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="Display markers visually denoting points in alarm."
                >Alarm Markers</div>
                <div class="grid-cell value">
                    {{ alarmMarkers ? "Enabled" : "Disabled" }}
                </div>
            </li>
            <li class="grid-row">
                <div class="grid-cell label"
                     title="The plot line and marker color for this series."
                >Color</div>
                <div class="grid-cell value">
                    <span class="c-color-swatch"
                          :style="{
                              'background': seriesHexColor
                          }"
                    >
                    </span>
                </div>
            </li>
        </ul>
    </li>
</ul>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        series: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            expanded: false
        };
    },
    computed: {
        getSeriesClass() {
            let cssClass = '';
            let legacyObject = this.openmct.legacyObject(this.series.domainObject);
            let location = legacyObject.getCapability('location');
            if (location && location.isLink()) {
                cssClass = 'l-icon-link';
            }

            let type = legacyObject.getCapability('type');
            if (type) {
                cssClass = `${cssClass} ${type.getCssClass()}`;
            }

            return cssClass;
        },
        expandedCssClass() {
            if (this.expanded === true) {
                return 'c-disclosure-triangle--expanded';
            }

            return '';
        },
        statusClass() {
            return (this.status) ? `is-status--${this.status}` : '';
        },
        yKey() {
            return this.series.get('yKey');
        },
        interpolate() {
            return this.series.get('interpolate');
        },
        markerOptionsDisplayText() {
            return this.series.markerOptionsDisplayText();
        },
        alarmMarkers() {
            return this.series.get('alarmMarkers');
        },
        seriesHexColor() {
            return this.series.get('color').asHexString();
        }
    },
    mounted() {
        this.status = this.openmct.status.get(this.series.domainObject.identifier);
        this.removeStatusListener = this.openmct.status.observe(this.series.domainObject.identifier, this.setStatus);
    },
    beforeDestroy() {
        if (this.removeStatusListener) {
            this.removeStatusListener();
        }
    },
    methods: {
        toggleExpanded() {
            this.expanded = !this.expanded;
        },
        setStatus(status) {
            this.status = status;
        }
    }
};
</script>
