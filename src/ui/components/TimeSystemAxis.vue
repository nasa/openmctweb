<template>
<div ref="axisHolder"
     class="c-timesystem-axis"
>
    <div class="nowMarker"><span class="icon-arrow-down"></span></div>
</div>
</template>

<script>
import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
import utcMultiTimeFormat from '@/plugins/timeConductor/utcMultiTimeFormat';

//TODO: UI direction needed for the following property values
const PADDING = 1;
const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;
//This offset needs to be re-considered

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        bounds: {
            type: Object,
            default() {
                return {};
            }
        },
        timeSystem: {
            type: Object,
            default() {
                return {};
            }
        },
        contentHeight: {
            type: Number,
            default() {
                return 0;
            }
        },
        renderingEngine: {
            type: String,
            default() {
                return 'svg';
            }
        },
        offset: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    watch: {
        bounds(newBounds) {
            this.drawAxis(newBounds, this.timeSystem);
        },
        timeSystem(newTimeSystem) {
            this.drawAxis(this.bounds, newTimeSystem);
        }
    },
    mounted() {
        if (this.renderingEngine === 'svg') {
            this.useSVG = true;
        }

        this.container = d3Selection.select(this.$refs.axisHolder);
        this.svgElement = this.container.append("svg:svg");
        // draw x axis with labels. CSS is used to position them.
        this.axisElement = this.svgElement.append("g")
            .attr("class", "axis")
            .attr('font-size', '1.3em')
            .attr("transform", "translate(0,20)");

        this.setDimensions();
        this.drawAxis(this.bounds, this.timeSystem);
        this.resizeTimer = setInterval(this.resize, RESIZE_POLL_INTERVAL);
    },
    destroyed() {
        clearInterval(this.resizeTimer);
    },
    methods: {
        resize() {
            if (this.$refs.axisHolder.clientWidth !== this.width) {
                this.setDimensions();
                this.drawAxis(this.bounds, this.timeSystem);
                this.updateNowMarker();
            }
        },
        updateNowMarker() {
            if (this.openmct.time.clock() === undefined) {
                let nowMarker = document.querySelector('.nowMarker');
                if (nowMarker) {
                    nowMarker.parentNode.removeChild(nowMarker);
                }
            } else {
                let nowMarker = document.querySelector('.nowMarker');
                if (nowMarker) {
                    const svgEl = d3Selection.select(this.svgElement).node();
                    let height = svgEl.style('height').replace('px', '');
                    height = Number(height) + this.contentHeight;
                    nowMarker.style.height = height + 'px';
                    const now = this.xScale(Date.now());
                    nowMarker.style.left = now + this.offset + 'px';
                }
            }
        },
        setDimensions() {
            const axisHolder = this.$refs.axisHolder;
            this.width = axisHolder.clientWidth;
            this.offsetWidth = this.width - this.offset;

            this.height = Math.round(axisHolder.getBoundingClientRect().height);

            if (this.useSVG) {
                this.svgElement.attr("width", this.width);
                this.svgElement.attr("height", this.height);
            } else {
                this.svgElement.attr("height", 50);
            }
        },
        drawAxis(bounds, timeSystem) {
            this.setScale(bounds, timeSystem);
            this.setAxis(bounds);
            this.axisElement.call(this.xAxis);
            this.updateNowMarker();

        },
        setScale(bounds, timeSystem) {
            if (!this.width) {
                return;
            }

            if (timeSystem === undefined) {
                timeSystem = this.openmct.time.timeSystem();
            }

            if (timeSystem.isUTCBased) {
                this.xScale = d3Scale.scaleUtc();
                this.xScale.domain(
                    [new Date(bounds.start), new Date(bounds.end)]
                );
            } else {
                this.xScale = d3Scale.scaleLinear();
                this.xScale.domain(
                    [bounds.start, bounds.end]
                );
            }

            this.xScale.range([PADDING, this.offsetWidth - PADDING * 2]);
        },
        setAxis() {
            this.xAxis = d3Axis.axisTop(this.xScale);
            this.xAxis.tickFormat(utcMultiTimeFormat);

            if (this.width > 1800) {
                this.xAxis.ticks(this.offsetWidth / PIXELS_PER_TICK_WIDE);
            } else {
                this.xAxis.ticks(this.offsetWidth / PIXELS_PER_TICK);
            }
        }
    }
};
</script>
