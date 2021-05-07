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

let brandingOptions = {};

/**
 * @typedef {Object} BrandingOptions
 * @memberOf openmct/branding
 * @property {string} smallLogoImage URL to the image to use as the applications logo.
 * This logo will appear on every screen and when clicked will launch the about dialog.
 * @property {string} aboutHtml Custom content for the about screen. When defined the
 * supplied content will be inserted at the start of the about dialog, and the default
 * Open MCT splash logo will be suppressed.
 */

/**
 * Set branding options for the application. These will override certain visual elements
 * of the application and allow for customization of the application.
 * @param {BrandingOptions} options
 */
export default function Branding(options) {
    if (arguments.length === 1) {
        brandingOptions = options;
    }

    return brandingOptions;
}
