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
    class="c-compass__hud c-hud"
>
    <div
        v-for="point in visibleCompassPoints"
        :key="point.direction"
        :class="point.class"
        :style="point.style"
    >
        {{ point.direction }}
    </div>
    <div
        v-if="isSunInRange"
        ref="sun"
        class="c-hud__sun"
        :style="sunPositionStyle"
    ></div>
    <div class="c-hud__range"></div>
</div>
</template>

<script>
import {
    rotate,
    inRange,
    percentOfRange
} from './utils';

const COMPASS_POINTS = [
    {
        direction: 'N',
        class: 'c-hud__dir',
        degrees: 0
    },
    {
        direction: 'NE',
        class: 'c-hud__dir--sub',
        degrees: 45
    },
    {
        direction: 'E',
        class: 'c-hud__dir',
        degrees: 90
    },
    {
        direction: 'SE',
        class: 'c-hud__dir--sub',
        degrees: 135
    },
    {
        direction: 'S',
        class: 'c-hud__dir',
        degrees: 180
    },
    {
        direction: 'SW',
        class: 'c-hud__dir--sub',
        degrees: 225
    },
    {
        direction: 'W',
        class: 'c-hud__dir',
        degrees: 270
    },
    {
        direction: 'NW',
        class: 'c-hud__dir--sub',
        degrees: 315
    }
];

export default {
    props: {
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
        }
    },
    computed: {
        visibleCompassPoints() {
            return COMPASS_POINTS
                .filter(point => inRange(point.degrees, this.visibleRange))
                .map(point => {
                    const percentage = percentOfRange(point.degrees, this.visibleRange);
                    point.style = Object.assign(
                        { left: `${ percentage * 100 }%` }
                    );

                    return point;
                });
        },
        isSunInRange() {
            return inRange(this.sunHeading, this.visibleRange);
        },
        sunPositionStyle() {
            const percentage = percentOfRange(this.sunHeading, this.visibleRange);

            return {
                left: `${ percentage * 100 }%`
            };
        },
        visibleRange() {
            return [
                rotate(this.cameraPan, -this.cameraAngleOfView / 2),
                rotate(this.cameraPan, this.cameraAngleOfView / 2)
            ];
        }
    }
};
</script>
