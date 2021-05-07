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

<span>
    <span
        v-for="segment in segments"
        :key="segment.id"
        :style="getStyles(segment)"
        :class="{ [highlightClass] : segment.type === 'highlight' }"
    >
        {{ segment.text }}
    </span>
</span>

</template>

<script>

import uuid from 'uuid';

export default {
    props: {
        text: {
            type: String,
            required: true
        },
        highlight: {
            type: String,
            default() {
                return '';
            }
        },
        highlightClass: {
            type: String,
            default() {
                return 'highlight';
            }
        }
    },
    data() {
        return {
            segments: []
        };
    },
    watch: {
        highlight() {
            this.highlightText();
        },
        text() {
            this.highlightText();
        }
    },
    mounted() {
        this.highlightText();
    },
    methods: {
        addHighlightSegment(segment) {
            this.segments.push({
                id: uuid(),
                text: segment,
                type: 'highlight',
                spaceBefore: segment.startsWith(' '),
                spaceAfter: segment.endsWith(' ')
            });
        },
        addTextSegment(segment) {
            this.segments.push({
                id: uuid(),
                text: segment,
                type: 'text',
                spaceBefore: segment.startsWith(' '),
                spaceAfter: segment.endsWith(' ')
            });
        },
        getStyles(segment) {
            let styles = {
                display: 'inline-block'
            };

            if (segment.spaceBefore) {
                styles.paddingLeft = '.33em';
            }

            if (segment.spaceAfter) {
                styles.paddingRight = '.33em';
            }

            return styles;
        },
        highlightText() {
            this.segments = [];
            let regex = new RegExp('(' + this.highlight + ')', 'gi');
            let textSegments = this.text.split(regex);

            for (let i = 0; i < textSegments.length; i++) {
                if (textSegments[i].toLowerCase() === this.highlight.toLowerCase()) {
                    this.addHighlightSegment(textSegments[i]);
                } else {
                    this.addTextSegment(textSegments[i]);
                }
            }
        }
    }
};
</script>
