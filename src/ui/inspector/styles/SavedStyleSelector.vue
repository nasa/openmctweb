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
<div>
    <div class="c-style c-style--saved has-local-controls c-toolbar">
        <div class="c-style__controls"
             :title="description"
             @click="selectStyle()"
        >
            <div
                class="c-style-thumb"
                :style="thumbStyle"
            >
                <span
                    class="c-style-thumb__text u-style-receiver js-style-receiver"
                    :class="{ 'hide-nice': !hasProperty(savedStyle.color) }"
                    :data-font="savedStyle.font"
                >
                    {{ thumbLabel }}
                </span>
            </div>
            <div
                class="c-icon-button c-icon-button--disabled c-icon-button--swatched icon-line-horz"
                title="Border color"
            >
                <div
                    class="c-swatch"
                    :style="{
                        background: borderColor
                    }"
                ></div>
            </div>
            <div
                class="c-icon-button c-icon-button--disabled c-icon-button--swatched icon-paint-bucket"
                title="Background color"
            >
                <div
                    class="c-swatch"
                    :style="{ background: savedStyle.backgroundColor }"
                ></div>
            </div>
            <div
                class="c-icon-button c-icon-button--disabled c-icon-button--swatched icon-font"
                title="Text color"
            >
                <div
                    class="c-swatch"
                    :style="{ background: savedStyle.color }"
                ></div>
            </div>
        </div>

        <div
            v-if="canDeleteStyle"
            class="c-style__button-delete c-local-controls--show-on-hover"
        >
            <div
                class="c-icon-button icon-trash"
                title="Delete this saved style"
                @click.stop="deleteStyle()"
            >
            </div>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'SavedStyleSelector',
    inject: [
        'openmct',
        'stylesManager'
    ],
    props: {
        isEditing: {
            type: Boolean,
            required: true
        },
        savedStyle: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            expanded: false
        };
    },
    computed: {
        borderColor() {
            return this.savedStyle.border.substring(this.savedStyle.border.indexOf('#'));
        },
        thumbStyle() {
            return {
                border: this.savedStyle.border,
                backgroundColor: this.savedStyle.backgroundColor,
                color: this.savedStyle.color
            };
        },
        thumbLabel() {
            return this.savedStyle.fontSize !== 'default' ? `${this.savedStyle.fontSize}px` : 'ABC';
        },
        description() {
            const fill = `Fill: ${this.savedStyle.backgroundColor || 'none'}`;
            const border = `Border: ${this.savedStyle.border || 'none'}`;
            const color = `Text Color: ${this.savedStyle.color || 'default'}`;
            const fontSize = this.savedStyle.fontSize ? `Font Size: ${this.savedStyle.fontSize}` : '';
            const font = this.savedStyle.font ? `Font Style: ${this.savedStyle.font}` : '';

            // Note: lack of indention in the return string is deliberate, it affects how the text is rendered
            return `Click to apply this style:
${fill}
${border}
${color}
${fontSize}
${font}`;
        },
        canDeleteStyle() {
            return this.isEditing;
        }
    },
    methods: {
        selectStyle() {
            if (this.isEditing) {
                this.stylesManager.select(this.savedStyle);
            }
        },
        deleteStyle() {
            this.showDeleteStyleDialog()
                .then(() => {
                    this.$emit('delete-style');
                })
                .catch(() => {});
        },
        showDeleteStyleDialog(style) {
            const message = `
                This will delete this saved style.
                This action will not effect styling that has already been applied.
                Do you want to continue?
            `;

            return new Promise((resolve, reject) => {
                let dialog = this.openmct.overlays.dialog({
                    title: 'Delete Saved Style',
                    iconClass: 'alert',
                    message: message,
                    buttons: [
                        {
                            label: 'OK',
                            callback: () => {
                                dialog.dismiss();
                                resolve();
                            }
                        },
                        {
                            label: 'Cancel',
                            callback: () => {
                                dialog.dismiss();
                                reject();
                            }
                        }
                    ]
                });
            });
        },
        hasProperty(property) {
            return property !== undefined;
        },
        toggleExpanded() {
            this.expanded = !this.expanded;
        }
    }
};
</script>
