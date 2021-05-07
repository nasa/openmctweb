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

/**
 * This bundle provides support for object inspection (specifically, metadata
 * show in bubbles on hover.)
 * @namespace platform/commonUI/inspect
 */

define({
    BUBBLE_TEMPLATE: "<mct-container key=\"bubble\" "
                + "bubble-title=\"{{bubbleTitle}}\" "
                + "bubble-layout=\"{{bubbleLayout}}\">"
                + "<mct-include key=\"bubbleTemplate\" "
                + "ng-model=\"bubbleModel\">"
                + "</mct-include>"
                + "</mct-container>",
    // Options and classes for bubble
    BUBBLE_OPTIONS: {
        offsetX: 0,
        offsetY: -26
    },
    BUBBLE_MOBILE_POSITION: [0, -25],
    // Max width and margins allowed for bubbles;
    // defined in /platform/commonUI/general/res/sass/_constants.scss
    BUBBLE_MARGIN_LR: 10,
    BUBBLE_MAX_WIDTH: 300
});
