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
<div class="c-inspector__saved-styles c-inspect-styles">
    <div class="c-inspect-styles__content">
        <div class="c-inspect-styles__saved-styles">
            <saved-style-selector
                v-for="(savedStyle, index) in savedStyles"
                :key="index"
                class="c-inspect-styles__saved-style"
                :is-editing="isEditing"
                :saved-style="savedStyle"
                @delete-style="deleteStyle(index)"
            />
        </div>
    </div>
</div>
</template>

<script>
import SavedStyleSelector from '@/ui/inspector/styles/SavedStyleSelector.vue';

export default {
    name: 'SavedStylesView',
    components: {
        SavedStyleSelector
    },
    inject: [
        'openmct',
        'selection',
        'stylesManager'
    ],
    data() {
        return {
            isEditing: this.openmct.editor.isEditing(),
            savedStyles: undefined
        };
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.setIsEditing);
        this.stylesManager.on('stylesUpdated', this.setStyles);
        this.stylesManager.on('limitReached', this.showLimitReachedDialog);
        this.stylesManager.on('persistError', this.showPersistErrorDialog);

        this.loadStyles();
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.setIsEditing);
        this.stylesManager.off('stylesUpdated', this.setStyles);
        this.stylesManager.off('limitReached', this.showLimitReachedDialog);
        this.stylesManager.off('persistError', this.showPersistErrorDialog);
    },
    methods: {
        setIsEditing(isEditing) {
            this.isEditing = isEditing;
        },
        loadStyles() {
            const styles = this.stylesManager.load();

            this.setStyles(styles);
        },
        setStyles(styles) {
            this.savedStyles = styles;
        },
        showLimitReachedDialog(limit) {
            const message = `
                You have reached the limit on the number of saved styles.
                Please delete one or more saved styles and try again.
            `;

            let dialog = this.openmct.overlays.dialog({
                title: 'Saved Styles Limit',
                iconClass: 'alert',
                message: message,
                buttons: [
                    {
                        label: 'OK',
                        callback: () => {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        },
        showPersistErrorDialog() {
            const message = `
                Problem encountered saving styles.
                Try again or delete one or more styles before trying again.
            `;
            let dialog = this.openmct.overlays.dialog({
                title: 'Error Saving Style',
                iconClass: 'error',
                message: message,
                buttons: [
                    {
                        label: 'OK',
                        callback: () => {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        },
        deleteStyle(index) {
            this.stylesManager.delete(index);
        }
    }
};
</script>
