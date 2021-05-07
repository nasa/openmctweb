/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<div
    tabindex="0"
    class="c-imagery"
    @keyup="arrowUpHandler"
    @keydown="arrowDownHandler"
    @mouseover="focusElement"
>
    <div class="c-imagery__main-image-wrapper has-local-controls">
        <div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover c-image-controls__controls">
            <span class="c-image-controls__sliders"
                  draggable="true"
                  @dragstart="startDrag"
            >
                <div class="c-image-controls__slider-wrapper icon-brightness">
                    <input v-model="filters.brightness"
                           type="range"
                           min="0"
                           max="500"
                    >
                </div>
                <div class="c-image-controls__slider-wrapper icon-contrast">
                    <input v-model="filters.contrast"
                           type="range"
                           min="0"
                           max="500"
                    >
                </div>
            </span>
            <span class="t-reset-btn-holder c-imagery__lc__reset-btn c-image-controls__btn-reset">
                <a class="s-icon-button icon-reset t-btn-reset"
                   @click="filters={brightness: 100, contrast: 100}"
                ></a>
            </span>
        </div>
        <div class="c-imagery__main-image__bg"
             :class="{'paused unnsynced': isPaused,'stale':false }"
        >
            <img
                ref="focusedImage"
                class="c-imagery__main-image__image js-imageryView-image"
                :src="imageUrl"
                :style="{
                    'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`
                }"
                :data-openmct-image-timestamp="time"
                :data-openmct-object-keystring="keyString"
            >
            <Compass
                v-if="shouldDisplayCompass"
                :container-width="imageContainerWidth"
                :container-height="imageContainerHeight"
                :natural-aspect-ratio="focusedImageNaturalAspectRatio"
                :image="focusedImage"
                :lock-compass="lockCompass"
                @toggle-lock-compass="toggleLockCompass"
            />
        </div>
        <div class="c-local-controls c-local-controls--show-on-hover c-imagery__prev-next-buttons">
            <button class="c-nav c-nav--prev"
                    title="Previous image"
                    :disabled="isPrevDisabled"
                    @click="prevImage()"
            ></button>
            <button class="c-nav c-nav--next"
                    title="Next image"
                    :disabled="isNextDisabled"
                    @click="nextImage()"
            ></button>
        </div>

        <div class="c-imagery__control-bar">
            <div class="c-imagery__time">
                <div class="c-imagery__timestamp u-style-receiver js-style-receiver">{{ time }}</div>

                <!-- image fresh -->
                <div
                    v-if="canTrackDuration"
                    :class="{'c-imagery--new': isImageNew && !refreshCSS}"
                    class="c-imagery__age icon-timer"
                >{{ formattedDuration }}</div>

                <!-- spacecraft position fresh -->
                <div
                    v-if="relatedTelemetry.hasRelatedTelemetry && isSpacecraftPositionFresh"
                    class="c-imagery__age icon-check c-imagery--new"
                >POS</div>

                <!-- camera position fresh -->
                <div
                    v-if="relatedTelemetry.hasRelatedTelemetry && isCameraPositionFresh"
                    class="c-imagery__age icon-check c-imagery--new"
                >CAM</div>
            </div>
            <div class="h-local-controls">
                <button
                    class="c-button icon-pause pause-play"
                    :class="{'is-paused': isPaused}"
                    @click="paused(!isPaused, 'button')"
                ></button>
            </div>
        </div>
    </div>
    <div
        ref="thumbsWrapper"
        class="c-imagery__thumbs-wrapper"
        :class="{'is-paused': isPaused}"
        @scroll="handleScroll"
    >
        <div v-for="(image, index) in imageHistory"
             :key="image.url + image.time"
             class="c-imagery__thumb c-thumb"
             :class="{ selected: focusedImageIndex === index && isPaused }"
             @click="setFocusedImage(index, thumbnailClick)"
        >
            <a href=""
               :download="image.imageDownloadName"
               @click.prevent
            >
                <img class="c-thumb__image"
                     :src="image.url"
                >
            </a>
            <div class="c-thumb__timestamp">{{ image.formattedTime }}</div>
        </div>
    </div>
</div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import Compass from './Compass/Compass.vue';
import RelatedTelemetry from './RelatedTelemetry/RelatedTelemetry';

const DEFAULT_DURATION_FORMATTER = 'duration';
const REFRESH_CSS_MS = 500;
const DURATION_TRACK_MS = 1000;
const ARROW_DOWN_DELAY_CHECK_MS = 400;
const ARROW_SCROLL_RATE_MS = 100;
const THUMBNAIL_CLICKED = true;

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const ONE_HOUR = ONE_MINUTE * 60;
const EIGHT_HOURS = 8 * ONE_HOUR;
const TWENTYFOUR_HOURS = EIGHT_HOURS * 3;

const ARROW_RIGHT = 39;
const ARROW_LEFT = 37;

export default {
    components: {
        Compass
    },
    inject: ['openmct', 'domainObject'],
    data() {
        let timeSystem = this.openmct.time.timeSystem();

        return {
            autoScroll: true,
            durationFormatter: undefined,
            filters: {
                brightness: 100,
                contrast: 100
            },
            imageHistory: [],
            thumbnailClick: THUMBNAIL_CLICKED,
            isPaused: false,
            metadata: {},
            requestCount: 0,
            timeSystem: timeSystem,
            timeFormatter: undefined,
            refreshCSS: false,
            keyString: undefined,
            focusedImageIndex: undefined,
            focusedImageRelatedTelemetry: {},
            numericDuration: undefined,
            metadataEndpoints: {},
            relatedTelemetry: {},
            latestRelatedTelemetry: {},
            focusedImageNaturalAspectRatio: undefined,
            imageContainerWidth: undefined,
            imageContainerHeight: undefined,
            lockCompass: true
        };
    },
    computed: {
        time() {
            return this.formatTime(this.focusedImage);
        },
        imageUrl() {
            return this.formatImageUrl(this.focusedImage);
        },
        isImageNew() {
            let cutoff = FIVE_MINUTES;
            let age = this.numericDuration;

            return age < cutoff && !this.refreshCSS;
        },
        canTrackDuration() {
            return this.openmct.time.clock() && this.timeSystem.isUTCBased;
        },
        focusedImageDownloadName() {
            return this.getImageDownloadName(this.focusedImage);
        },
        isNextDisabled() {
            let disabled = false;

            if (this.focusedImageIndex === -1 || this.focusedImageIndex === this.imageHistory.length - 1) {
                disabled = true;
            }

            return disabled;
        },
        isPrevDisabled() {
            let disabled = false;

            if (this.focusedImageIndex === 0 || this.imageHistory.length < 2) {
                disabled = true;
            }

            return disabled;
        },
        focusedImage() {
            return this.imageHistory[this.focusedImageIndex];
        },
        parsedSelectedTime() {
            return this.parseTime(this.focusedImage);
        },
        formattedDuration() {
            let result = 'N/A';
            let negativeAge = -1;

            if (this.numericDuration > TWENTYFOUR_HOURS) {
                negativeAge *= (this.numericDuration / TWENTYFOUR_HOURS);
                result = moment.duration(negativeAge, 'days').humanize(true);
            } else if (this.numericDuration > EIGHT_HOURS) {
                negativeAge *= (this.numericDuration / ONE_HOUR);
                result = moment.duration(negativeAge, 'hours').humanize(true);
            } else if (this.durationFormatter) {
                result = this.durationFormatter.format(this.numericDuration);
            }

            return result;
        },
        shouldDisplayCompass() {
            return this.focusedImage !== undefined
                && this.focusedImageNaturalAspectRatio !== undefined
                && this.imageContainerWidth !== undefined
                && this.imageContainerHeight !== undefined;
        },
        isSpacecraftPositionFresh() {
            let isFresh = undefined;
            let latest = this.latestRelatedTelemetry;
            let focused = this.focusedImageRelatedTelemetry;

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                isFresh = true;
                for (let key of this.spacecraftPositionKeys) {
                    if (this.relatedTelemetry[key] && latest[key] && focused[key]) {
                        isFresh = isFresh && Boolean(this.relatedTelemetry[key].comparisonFunction(latest[key], focused[key]));
                    } else {
                        isFresh = false;
                    }
                }
            }

            return isFresh;
        },
        isSpacecraftOrientationFresh() {
            let isFresh = undefined;
            let latest = this.latestRelatedTelemetry;
            let focused = this.focusedImageRelatedTelemetry;

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                isFresh = true;
                for (let key of this.spacecraftOrientationKeys) {
                    if (this.relatedTelemetry[key] && latest[key] && focused[key]) {
                        isFresh = isFresh && Boolean(this.relatedTelemetry[key].comparisonFunction(latest[key], focused[key]));
                    } else {
                        isFresh = false;
                    }
                }
            }

            return isFresh;
        },
        isCameraPositionFresh() {
            let isFresh = undefined;
            let latest = this.latestRelatedTelemetry;
            let focused = this.focusedImageRelatedTelemetry;

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                isFresh = true;

                // camera freshness relies on spacecraft position freshness
                if (this.isSpacecraftPositionFresh && this.isSpacecraftOrientationFresh) {
                    for (let key of this.cameraKeys) {
                        if (this.relatedTelemetry[key] && latest[key] && focused[key]) {
                            isFresh = isFresh && Boolean(this.relatedTelemetry[key].comparisonFunction(latest[key], focused[key]));
                        } else {
                            isFresh = false;
                        }
                    }
                } else {
                    isFresh = false;
                }
            }

            return isFresh;
        }
    },
    watch: {
        focusedImageIndex() {
            this.trackDuration();
            this.resetAgeCSS();
            this.updateRelatedTelemetryForFocusedImage();
            this.getImageNaturalDimensions();
        }
    },
    async mounted() {
        // listen
        this.openmct.time.on('bounds', this.boundsChange);
        this.openmct.time.on('timeSystem', this.timeSystemChange);
        this.openmct.time.on('clock', this.clockChange);

        // set
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.imageHints = { ...this.metadata.valuesForHints(['image'])[0] };
        this.durationFormatter = this.getFormatter(this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        this.imageFormatter = this.openmct.telemetry.getValueFormatter(this.imageHints);
        this.imageDownloadNameHints = { ...this.metadata.valuesForHints(['imageDownloadName'])[0]};

        // related telemetry keys
        this.spacecraftPositionKeys = ['positionX', 'positionY', 'positionZ'];
        this.spacecraftOrientationKeys = ['heading'];
        this.cameraKeys = ['cameraPan', 'cameraTilt'];
        this.sunKeys = ['sunOrientation'];

        // initialize
        this.timeKey = this.timeSystem.key;
        this.timeFormatter = this.getFormatter(this.timeKey);

        // kickoff
        this.subscribe();
        this.requestHistory();

        // related telemetry
        await this.initializeRelatedTelemetry();
        this.updateRelatedTelemetryForFocusedImage();
        this.trackLatestRelatedTelemetry();

        // for scrolling through images quickly and resizing the object view
        _.debounce(this.updateRelatedTelemetryForFocusedImage, 400);
        _.debounce(this.resizeImageContainer, 400);

        this.imageContainerResizeObserver = new ResizeObserver(this.resizeImageContainer);
        this.imageContainerResizeObserver.observe(this.$refs.focusedImage);
    },
    updated() {
        this.scrollToRight();
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }

        this.imageContainerResizeObserver.disconnect();

        if (this.relatedTelemetry.hasRelatedTelemetry) {
            this.relatedTelemetry.destroy();
        }

        this.stopDurationTracking();
        this.openmct.time.off('bounds', this.boundsChange);
        this.openmct.time.off('timeSystem', this.timeSystemChange);
        this.openmct.time.off('clock', this.clockChange);

        // unsubscribe from related telemetry
        if (this.relatedTelemetry.hasRelatedTelemetry) {
            for (let key of this.relatedTelemetry.keys) {
                if (this.relatedTelemetry[key] && this.relatedTelemetry[key].unsubscribe) {
                    this.relatedTelemetry[key].unsubscribe();
                }
            }
        }
    },
    methods: {
        async initializeRelatedTelemetry() {
            this.relatedTelemetry = new RelatedTelemetry(
                this.openmct,
                this.domainObject,
                [...this.spacecraftPositionKeys, ...this.spacecraftOrientationKeys, ...this.cameraKeys, ...this.sunKeys]
            );

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                await this.relatedTelemetry.load();
            }
        },
        async getMostRecentRelatedTelemetry(key, targetDatum) {
            if (!this.relatedTelemetry.hasRelatedTelemetry) {
                throw new Error(`${this.domainObject.name} does not have any related telemetry`);
            }

            if (!this.relatedTelemetry[key]) {
                throw new Error(`${key} does not exist on related telemetry`);
            }

            let mostRecent;
            let valueKey = this.relatedTelemetry[key].historical.valueKey;
            let valuesOnTelemetry = this.relatedTelemetry[key].hasTelemetryOnDatum;

            if (valuesOnTelemetry) {
                mostRecent = targetDatum[valueKey];

                if (mostRecent) {
                    return mostRecent;
                } else {
                    console.warn(`Related Telemetry for ${key} does NOT exist on this telemetry datum as configuration implied.`);

                    return;
                }
            }

            mostRecent = await this.relatedTelemetry[key].requestLatestFor(targetDatum);

            return mostRecent[valueKey];
        },
        // will subscribe to data for this key if not already done
        subscribeToDataForKey(key) {
            if (this.relatedTelemetry[key].isSubscribed) {
                return;
            }

            if (this.relatedTelemetry[key].realtimeDomainObject) {
                this.relatedTelemetry[key].unsubscribe = this.openmct.telemetry.subscribe(
                    this.relatedTelemetry[key].realtimeDomainObject, datum => {
                        this.relatedTelemetry[key].listeners.forEach(callback => {
                            callback(datum);
                        });

                    }
                );

                this.relatedTelemetry[key].isSubscribed = true;
            }
        },
        async updateRelatedTelemetryForFocusedImage() {
            if (!this.relatedTelemetry.hasRelatedTelemetry || !this.focusedImage) {
                return;
            }

            // set data ON image telemetry as well as in focusedImageRelatedTelemetry
            for (let key of this.relatedTelemetry.keys) {
                if (
                    this.relatedTelemetry[key]
                    && this.relatedTelemetry[key].historical
                    && this.relatedTelemetry[key].requestLatestFor

                ) {
                    let valuesOnTelemetry = this.relatedTelemetry[key].hasTelemetryOnDatum;
                    let value = await this.getMostRecentRelatedTelemetry(key, this.focusedImage);

                    if (!valuesOnTelemetry) {
                        this.$set(this.imageHistory[this.focusedImageIndex], key, value); // manually add to telemetry
                    }

                    this.$set(this.focusedImageRelatedTelemetry, key, value);
                }
            }
        },
        trackLatestRelatedTelemetry() {
            [...this.spacecraftPositionKeys, ...this.spacecraftOrientationKeys, ...this.cameraKeys, ...this.sunKeys].forEach(key => {
                if (this.relatedTelemetry[key] && this.relatedTelemetry[key].subscribe) {
                    this.relatedTelemetry[key].subscribe((datum) => {
                        let valueKey = this.relatedTelemetry[key].realtime.valueKey;
                        this.$set(this.latestRelatedTelemetry, key, datum[valueKey]);
                    });
                }
            });
        },
        focusElement() {
            this.$el.focus();
        },
        datumIsNotValid(datum) {
            if (this.imageHistory.length === 0) {
                return false;
            }

            const datumURL = this.formatImageUrl(datum);
            const lastHistoryURL = this.formatImageUrl(this.imageHistory.slice(-1)[0]);

            // datum is not valid if it matches the last datum in history,
            // or it is before the last datum in the history
            const datumTimeCheck = this.parseTime(datum);
            const historyTimeCheck = this.parseTime(this.imageHistory.slice(-1)[0]);
            const matchesLast = (datumTimeCheck === historyTimeCheck) && (datumURL === lastHistoryURL);
            const isStale = datumTimeCheck < historyTimeCheck;

            return matchesLast || isStale;
        },
        formatImageUrl(datum) {
            if (!datum) {
                return;
            }

            return this.imageFormatter.format(datum);
        },
        formatTime(datum) {
            if (!datum) {
                return;
            }

            let dateTimeStr = this.timeFormatter.format(datum);

            // Replace ISO "T" with a space to allow wrapping
            return dateTimeStr.replace("T", " ");
        },
        getImageDownloadName(datum) {
            let imageDownloadName = '';
            if (datum) {
                const key = this.imageDownloadNameHints.key;
                imageDownloadName = datum[key];
            }

            return imageDownloadName;
        },
        parseTime(datum) {
            if (!datum) {
                return;
            }

            return this.timeFormatter.parse(datum);
        },
        handleScroll() {
            const thumbsWrapper = this.$refs.thumbsWrapper;
            if (!thumbsWrapper) {
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = thumbsWrapper;
            const disableScroll = (scrollWidth - scrollLeft) > 2 * clientWidth
                    || (scrollHeight - scrollTop) > 2 * clientHeight;
            this.autoScroll = !disableScroll;
        },
        paused(state, type) {

            this.isPaused = state;

            if (type === 'button') {
                this.setFocusedImage(this.imageHistory.length - 1);
            }

            if (this.nextImageIndex) {
                this.setFocusedImage(this.nextImageIndex);
                delete this.nextImageIndex;
            }

            this.autoScroll = true;
        },
        scrollToFocused() {
            const thumbsWrapper = this.$refs.thumbsWrapper;
            if (!thumbsWrapper) {
                return;
            }

            let domThumb = thumbsWrapper.children[this.focusedImageIndex];

            if (domThumb) {
                domThumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        },
        scrollToRight() {
            if (this.isPaused || !this.$refs.thumbsWrapper || !this.autoScroll) {
                return;
            }

            const scrollWidth = this.$refs.thumbsWrapper.scrollWidth || 0;
            if (!scrollWidth) {
                return;
            }

            setTimeout(() => this.$refs.thumbsWrapper.scrollLeft = scrollWidth, 0);
        },
        setFocusedImage(index, thumbnailClick = false) {
            if (this.isPaused && !thumbnailClick) {
                this.nextImageIndex = index;

                return;
            }

            this.focusedImageIndex = index;

            if (thumbnailClick && !this.isPaused) {
                this.paused(true);
            }
        },
        boundsChange(bounds, isTick) {
            if (!isTick) {
                this.requestHistory();
            }
        },
        async requestHistory() {
            let bounds = this.openmct.time.bounds();
            this.requestCount++;
            const requestId = this.requestCount;
            this.imageHistory = [];

            let data = await this.openmct.telemetry
                .request(this.domainObject, bounds) || [];

            if (this.requestCount === requestId) {
                data.forEach((datum, index) => {
                    this.updateHistory(datum, index === data.length - 1);
                });
            }
        },
        timeSystemChange(system) {
            this.timeSystem = this.openmct.time.timeSystem();
            this.timeKey = this.timeSystem.key;
            this.timeFormatter = this.getFormatter(this.timeKey);
            this.durationFormatter = this.getFormatter(this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            this.trackDuration();
        },
        clockChange(clock) {
            this.trackDuration();
        },
        subscribe() {
            this.unsubscribe = this.openmct.telemetry
                .subscribe(this.domainObject, (datum) => {
                    let parsedTimestamp = this.parseTime(datum);
                    let bounds = this.openmct.time.bounds();

                    if (parsedTimestamp >= bounds.start && parsedTimestamp <= bounds.end) {
                        this.updateHistory(datum);
                    }
                });
        },
        updateHistory(datum, setFocused = true) {
            if (this.datumIsNotValid(datum)) {
                return;
            }

            let image = { ...datum };
            image.formattedTime = this.formatTime(datum);
            image.url = this.formatImageUrl(datum);
            image.time = datum[this.timeKey];
            image.imageDownloadName = this.getImageDownloadName(datum);

            this.imageHistory.push(image);

            if (setFocused) {
                this.setFocusedImage(this.imageHistory.length - 1);
            }
        },
        getFormatter(key) {
            let metadataValue = this.metadata.value(key) || { format: key };
            let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

            return valueFormatter;
        },
        trackDuration() {
            if (this.canTrackDuration) {
                this.stopDurationTracking();
                this.updateDuration();
                this.durationTracker = window.setInterval(
                    this.updateDuration, DURATION_TRACK_MS
                );
            } else {
                this.stopDurationTracking();
            }
        },
        stopDurationTracking() {
            window.clearInterval(this.durationTracker);
        },
        updateDuration() {
            let currentTime = this.openmct.time.clock().currentValue();
            this.numericDuration = currentTime - this.parsedSelectedTime;
        },
        resetAgeCSS() {
            this.refreshCSS = true;
            // unable to make this work with nextTick
            setTimeout(() => {
                this.refreshCSS = false;
            }, REFRESH_CSS_MS);
        },
        nextImage() {
            if (this.isNextDisabled) {
                return;
            }

            let index = this.focusedImageIndex;

            this.setFocusedImage(++index, THUMBNAIL_CLICKED);
            if (index === this.imageHistory.length - 1) {
                this.paused(false);
            }
        },
        prevImage() {
            if (this.isPrevDisabled) {
                return;
            }

            let index = this.focusedImageIndex;

            if (index === this.imageHistory.length - 1) {
                this.setFocusedImage(this.imageHistory.length - 2, THUMBNAIL_CLICKED);
            } else {
                this.setFocusedImage(--index, THUMBNAIL_CLICKED);
            }
        },
        startDrag(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        arrowDownHandler(event) {
            let key = event.keyCode;

            if (this.isLeftOrRightArrowKey(key)) {
                this.arrowDown = true;
                window.clearTimeout(this.arrowDownDelayTimeout);
                this.arrowDownDelayTimeout = window.setTimeout(() => {
                    this.arrowKeyScroll(this.directionByKey(key));
                }, ARROW_DOWN_DELAY_CHECK_MS);
            }
        },
        arrowUpHandler(event) {
            let key = event.keyCode;

            window.clearTimeout(this.arrowDownDelayTimeout);

            if (this.isLeftOrRightArrowKey(key)) {
                this.arrowDown = false;
                let direction = this.directionByKey(key);
                this[direction + 'Image']();
            }
        },
        arrowKeyScroll(direction) {
            if (this.arrowDown) {
                this.arrowKeyScrolling = true;
                this[direction + 'Image']();
                setTimeout(() => {
                    this.arrowKeyScroll(direction);
                }, ARROW_SCROLL_RATE_MS);
            } else {
                window.clearTimeout(this.arrowDownDelayTimeout);
                this.arrowKeyScrolling = false;
                this.scrollToFocused();
            }
        },
        directionByKey(keyCode) {
            let direction;

            if (keyCode === ARROW_LEFT) {
                direction = 'prev';
            }

            if (keyCode === ARROW_RIGHT) {
                direction = 'next';
            }

            return direction;
        },
        isLeftOrRightArrowKey(keyCode) {
            return [ARROW_RIGHT, ARROW_LEFT].includes(keyCode);
        },
        getImageNaturalDimensions() {
            this.focusedImageNaturalAspectRatio = undefined;

            const img = this.$refs.focusedImage;
            if (!img) {
                return;
            }

            // TODO - should probably cache this
            img.addEventListener('load', () => {
                this.focusedImageNaturalAspectRatio = img.naturalWidth / img.naturalHeight;
            }, { once: true });
        },
        resizeImageContainer() {
            if (this.$refs.focusedImage.clientWidth !== this.imageContainerWidth) {
                this.imageContainerWidth = this.$refs.focusedImage.clientWidth;
            }

            if (this.$refs.focusedImage.clientHeight !== this.imageContainerHeight) {
                this.imageContainerHeight = this.$refs.focusedImage.clientHeight;
            }
        },
        toggleLockCompass() {
            this.lockCompass = !this.lockCompass;
        }
    }
};
</script>
