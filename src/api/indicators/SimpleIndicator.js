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

define(['zepto', './res/indicator-template.html'],
    function ($, indicatorTemplate) {
        const DEFAULT_ICON_CLASS = 'icon-info';

        function SimpleIndicator(openmct) {
            this.openmct = openmct;
            this.element = $(indicatorTemplate)[0];

            this.textElement = this.element.querySelector('.js-indicator-text');

            //Set defaults
            this.text('New Indicator');
            this.description('');
            this.iconClass(DEFAULT_ICON_CLASS);
            this.statusClass('');
        }

        SimpleIndicator.prototype.text = function (text) {
            if (text !== undefined && text !== this.textValue) {
                this.textValue = text;
                this.textElement.innerText = text;

                if (!text) {
                    this.element.classList.add('hidden');
                } else {
                    this.element.classList.remove('hidden');
                }
            }

            return this.textValue;
        };

        SimpleIndicator.prototype.description = function (description) {
            if (description !== undefined && description !== this.descriptionValue) {
                this.descriptionValue = description;
                this.element.title = description;
            }

            return this.descriptionValue;
        };

        SimpleIndicator.prototype.iconClass = function (iconClass) {
            if (iconClass !== undefined && iconClass !== this.iconClassValue) {
                // element.classList is precious and throws errors if you try and add
                // or remove empty strings
                if (this.iconClassValue) {
                    this.element.classList.remove(this.iconClassValue);
                }

                if (iconClass) {
                    this.element.classList.add(iconClass);
                }

                this.iconClassValue = iconClass;
            }

            return this.iconClassValue;
        };

        SimpleIndicator.prototype.statusClass = function (statusClass) {
            if (statusClass !== undefined && statusClass !== this.statusClassValue) {
                if (this.statusClassValue) {
                    this.element.classList.remove(this.statusClassValue);
                }

                if (statusClass) {
                    this.element.classList.add(statusClass);
                }

                this.statusClassValue = statusClass;
            }

            return this.statusClassValue;
        };

        return SimpleIndicator;
    }
);
