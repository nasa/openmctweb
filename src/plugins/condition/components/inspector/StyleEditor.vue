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
<div class="c-style has-local-controls c-toolbar">
    <div class="c-style__controls">
        <div :class="[
                 { 'is-style-invisible': styleItem.style && styleItem.style.isStyleInvisible },
                 { 'c-style-thumb--mixed': mixedStyles.indexOf('backgroundColor') > -1 }
             ]"
             :style="[styleItem.style.imageUrl ? { backgroundImage:'url(' + styleItem.style.imageUrl + ')'} : itemStyle ]"
             class="c-style-thumb"
        >
            <span class="c-style-thumb__text"
                  :class="{ 'hide-nice': !hasProperty(styleItem.style.color) }"
            >
                ABC
            </span>
        </div>

        <toolbar-color-picker v-if="hasProperty(styleItem.style.border)"
                              class="c-style__toolbar-button--border-color u-menu-to--center"
                              :options="borderColorOption"
                              @change="updateStyleValue"
        />
        <toolbar-color-picker v-if="hasProperty(styleItem.style.backgroundColor)"
                              class="c-style__toolbar-button--background-color u-menu-to--center"
                              :options="backgroundColorOption"
                              @change="updateStyleValue"
        />
        <toolbar-color-picker v-if="hasProperty(styleItem.style.color)"
                              class="c-style__toolbar-button--color u-menu-to--center"
                              :options="colorOption"
                              @change="updateStyleValue"
        />
        <toolbar-button v-if="hasProperty(styleItem.style.imageUrl)"
                        class="c-style__toolbar-button--image-url"
                        :options="imageUrlOption"
                        @change="updateStyleValue"
        />
        <toolbar-toggle-button v-if="hasProperty(styleItem.style.isStyleInvisible)"
                               class="c-style__toolbar-button--toggle-visible"
                               :options="isStyleInvisibleOption"
                               @change="updateStyleValue"
        />
    </div>

    <!-- Save Styles -->
    <toolbar-button v-if="canSaveStyle"
                    class="c-style__toolbar-button--save c-local-controls--show-on-hover c-icon-button c-icon-button--major"
                    :options="saveOptions"
                    @click="saveItemStyle()"
    />
</div>
</template>

<script>

import ToolbarColorPicker from "@/ui/toolbar/components/toolbar-color-picker.vue";
import ToolbarButton from "@/ui/toolbar/components/toolbar-button.vue";
import ToolbarToggleButton from "@/ui/toolbar/components/toolbar-toggle-button.vue";
import {STYLE_CONSTANTS} from "@/plugins/condition/utils/constants";
import {getStylesWithoutNoneValue} from "@/plugins/condition/utils/styleUtils";

export default {
    name: 'StyleEditor',
    components: {
        ToolbarButton,
        ToolbarColorPicker,
        ToolbarToggleButton
    },
    inject: ['openmct'],
    props: {
        isEditing: {
            type: Boolean,
            required: true
        },
        mixedStyles: {
            type: Array,
            default() {
                return [];
            }
        },
        nonSpecificFontProperties: {
            type: Array,
            required: true
        },
        styleItem: {
            type: Object,
            required: true
        }
    },
    computed: {
        itemStyle() {
            return getStylesWithoutNoneValue(this.styleItem.style);
        },
        borderColorOption() {
            let value = this.styleItem.style.border.replace('1px solid ', '');

            return {
                icon: 'icon-line-horz',
                title: STYLE_CONSTANTS.borderColorTitle,
                value: this.normalizeValueForSwatch(value),
                property: 'border',
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('border') > -1
            };
        },
        backgroundColorOption() {
            let value = this.styleItem.style.backgroundColor;

            return {
                icon: 'icon-paint-bucket',
                title: STYLE_CONSTANTS.backgroundColorTitle,
                value: this.normalizeValueForSwatch(value),
                property: 'backgroundColor',
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('backgroundColor') > -1
            };
        },
        colorOption() {
            let value = this.styleItem.style.color;

            return {
                icon: 'icon-font',
                title: STYLE_CONSTANTS.textColorTitle,
                value: this.normalizeValueForSwatch(value),
                property: 'color',
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('color') > -1
            };
        },
        imageUrlOption() {
            return {
                icon: 'icon-image',
                title: STYLE_CONSTANTS.imagePropertiesTitle,
                dialog: {
                    name: "Image Properties",
                    sections: [
                        {
                            rows: [
                                {
                                    key: "url",
                                    control: "textfield",
                                    name: "Image URL",
                                    "cssClass": "l-input-lg"
                                }
                            ]
                        }
                    ]
                },
                property: 'imageUrl',
                formKeys: ['url'],
                value: {url: this.styleItem.style.imageUrl},
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('imageUrl') > -1
            };
        },
        isStyleInvisibleOption() {
            return {
                value: this.styleItem.style.isStyleInvisible,
                property: 'isStyleInvisible',
                isEditing: this.isEditing,
                options: [
                    {
                        value: '',
                        icon: 'icon-eye-disabled',
                        title: STYLE_CONSTANTS.visibilityHidden
                    },
                    {
                        value: STYLE_CONSTANTS.isStyleInvisible,
                        icon: 'icon-eye-open',
                        title: STYLE_CONSTANTS.visibilityVisible
                    }
                ]
            };
        },
        saveOptions() {
            return {
                icon: 'icon-save',
                title: 'Save style',
                isEditing: this.isEditing
            };
        },
        canSaveStyle() {
            return this.isEditing && !this.mixedStyles.length && !this.nonSpecificFontProperties.length;
        }
    },
    methods: {
        hasProperty(property) {
            return property !== undefined;
        },
        normalizeValueForSwatch(value) {
            if (value && value.indexOf('__no_value') > -1) {
                return value.replace('__no_value', 'transparent');
            }

            return value;
        },
        normalizeValueForStyle(value) {
            if (value && value === 'transparent') {
                return '__no_value';
            }

            return value;
        },
        updateStyleValue(value, item) {
            value = this.normalizeValueForStyle(value);
            if (item.property === 'border') {
                value = '1px solid ' + value;
            }

            if (value && (value.url !== undefined)) {
                this.styleItem.style[item.property] = value.url;
            } else {
                this.styleItem.style[item.property] = value;
            }

            this.$emit('persist', this.styleItem, item.property);
        },
        saveItemStyle() {
            this.$emit('save-style', this.itemStyle);
        }
    }
};
</script>
