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
    class="c-direction-rose"
    @click="toggleLockCompass"
>
    <div
        class="c-nsew"
        :style="compassRoseStyle"
    >
        <svg
            class="c-nsew__minor-ticks"
            viewBox="0 0 100 100"
        >
            <rect
                class="c-nsew__tick c-tick-ne"
                x="49"
                y="0"
                width="2"
                height="5"
            />
            <rect
                class="c-nsew__tick c-tick-se"
                x="95"
                y="49"
                width="5"
                height="2"
            />
            <rect
                class="c-nsew__tick c-tick-sw"
                x="49"
                y="95"
                width="2"
                height="5"
            />
            <rect
                class="c-nsew__tick c-tick-nw"
                x="0"
                y="49"
                width="5"
                height="2"
            />

        </svg>

        <svg
            class="c-nsew__ticks"
            viewBox="0 0 100 100"
        >
            <polygon
                class="c-nsew__tick c-tick-n"
                points="50,0 57,5 43,5"
            />
            <rect
                class="c-nsew__tick c-tick-e"
                x="95"
                y="49"
                width="5"
                height="2"
            />
            <rect
                class="c-nsew__tick c-tick-w"
                x="0"
                y="49"
                width="5"
                height="2"
            />
            <rect
                class="c-nsew__tick c-tick-s"
                x="49"
                y="95"
                width="2"
                height="5"
            />

            <text
                class="c-nsew__label c-label-n"
                text-anchor="middle"
                :transform="northTextTransform"
            >N</text>
            <text
                class="c-nsew__label c-label-e"
                text-anchor="middle"
                :transform="eastTextTransform"
            >E</text>
            <text
                class="c-nsew__label c-label-w"
                text-anchor="middle"
                :transform="southTextTransform"
            >W</text>
            <text
                class="c-nsew__label c-label-s"
                text-anchor="middle"
                :transform="westTextTransform"
            >S</text>
        </svg>
    </div>

    <div
        v-if="hasHeading"
        class="c-spacecraft-body"
        :style="headingStyle"
    >
    </div>

    <div
        v-if="hasSunHeading"
        class="c-sun"
        :style="sunHeadingStyle"
    ></div>

    <div
        class="c-cam-field"
        :style="cameraPanStyle"
    >
        <div class="cam-field-half cam-field-half-l">
            <div
                class="cam-field-area"
                :style="cameraFOVStyleLeftHalf"
            ></div>
        </div>
        <div class="cam-field-half cam-field-half-r">
            <div
                class="cam-field-area"
                :style="cameraFOVStyleRightHalf"
            ></div>
        </div>
    </div>
</div>
</template>

<script>
import { rotate } from './utils';

export default {
    props: {
        heading: {
            type: Number,
            required: true
        },
        sunHeading: {
            type: Number,
            default: undefined
        },
        cameraAngleOfView: {
            type: Number,
            default: undefined
        },
        cameraPan: {
            type: Number,
            required: true
        },
        lockCompass: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        north() {
            return this.lockCompass ? rotate(-this.cameraPan) : 0;
        },
        compassRoseStyle() {
            return { transform: `rotate(${ this.north }deg)` };
        },
        northTextTransform() {
            return this.cardinalPointsTextTransform.north;
        },
        eastTextTransform() {
            return this.cardinalPointsTextTransform.east;
        },
        southTextTransform() {
            return this.cardinalPointsTextTransform.south;
        },
        westTextTransform() {
            return this.cardinalPointsTextTransform.west;
        },
        cardinalPointsTextTransform() {
            /**
             * cardinal points text must be rotated
             * in the opposite direction that north is rotated
             * to keep text vertically oriented
             */
            const rotation = `rotate(${ -this.north })`;

            return {
                north: `translate(50,15) ${ rotation }`,
                east: `translate(87,50) ${ rotation }`,
                south: `translate(13,50) ${ rotation }`,
                west: `translate(50,87) ${ rotation }`
            };
        },
        hasHeading() {
            return this.heading !== undefined;
        },
        headingStyle() {
            const rotation = rotate(this.north, this.heading);

            return {
                transform: `translateX(-50%) rotate(${ rotation }deg)`
            };
        },
        hasSunHeading() {
            return this.sunHeading !== undefined;
        },
        sunHeadingStyle() {
            const rotation = rotate(this.north, this.sunHeading);

            return {
                transform: `rotate(${ rotation }deg)`
            };
        },
        cameraPanStyle() {
            const rotation = rotate(this.north, this.cameraPan);

            return {
                transform: `rotate(${ rotation }deg)`
            };
        },
        // left half of camera field of view
        // rotated counter-clockwise from camera pan angle
        cameraFOVStyleLeftHalf() {
            return {
                transform: `translateX(50%) rotate(${ -this.cameraAngleOfView / 2 }deg)`
            };
        },
        // right half of camera field of view
        // rotated clockwise from camera pan angle
        cameraFOVStyleRightHalf() {
            return {
                transform: `translateX(-50%) rotate(${ this.cameraAngleOfView / 2 }deg)`
            };
        }
    },
    methods: {
        toggleLockCompass() {
            this.$emit('toggle-lock-compass');
        }
    }
};
</script>
