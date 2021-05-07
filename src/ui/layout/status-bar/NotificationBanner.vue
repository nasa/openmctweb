<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.
 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.
 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div
    v-if="activeModel.message"
    class="c-message-banner"
    :class="[
        activeModel.severity,
        {
            'minimized': activeModel.minimized,
            'new': !activeModel.minimized
        }]"
    @click="maximize()"
>
    <span class="c-message-banner__message">{{ activeModel.message }}</span>
    <span v-if="haslink"
          class="c-message-banner__message"
          :class="[haslink ? getLinkProps.cssClass : '']"
    >{{ getLinkProps.text }}</span>

    <progress-bar
        v-if="activeModel.progressPerc !== undefined"
        class="c-message-banner__progress-bar"
        :model="activeModel"
    />
    <button
        class="c-message-banner__close-button c-click-icon icon-x-in-circle"
        @click.stop="dismiss()"
    ></button>
</div>
</template>

<script>
import ProgressBar from '../../components/ProgressBar.vue';

let activeNotification = undefined;
let maximizedDialog = undefined;
let minimizeButton = {
    label: 'Dismiss',
    callback: dismissMaximizedDialog
};

function dismissMaximizedDialog() {
    if (maximizedDialog) {
        maximizedDialog.dismiss();
        maximizedDialog = undefined;
    }
}

function updateMaxProgressBar(progressPerc, progressText) {
    if (maximizedDialog) {
        maximizedDialog.updateProgress(progressPerc, progressText);

        if (progressPerc >= 100) {
            dismissMaximizedDialog();
        }
    }
}

export default {
    components: {
        ProgressBar: ProgressBar
    },
    inject: ['openmct'],
    data() {
        return {
            activeModel: {
                message: undefined,
                progressPerc: undefined,
                progressText: undefined,
                minimized: undefined,
                options: undefined
            }
        };
    },
    computed: {
        haslink() {
            const options = this.activeModel.options;

            return options && options.link;
        },
        getLinkProps() {
            return this.activeModel.options.link;
        },
        progressWidth() {
            return {
                width: this.activeModel.progress + '%'
            };
        }
    },
    mounted() {
        this.openmct.notifications.on('notification', this.showNotification);
        this.openmct.notifications.on('dismiss-all', this.clearModel);
    },
    methods: {
        showNotification(notification) {
            if (activeNotification) {
                activeNotification.off('progress', this.updateProgress);
                activeNotification.off('minimized', this.minimized);
                activeNotification.off('destroy', this.destroyActiveNotification);
            }

            activeNotification = notification;
            this.clearModel();
            this.applyModel(notification.model);

            activeNotification.once('destroy', this.destroyActiveNotification);
            activeNotification.on('progress', this.updateProgress);
            activeNotification.on('minimized', this.minimized);
        },
        isEqual(modelA, modelB) {
            return modelA.message === modelB.message
                    && modelA.timestamp === modelB.timestamp;
        },
        applyModel(model) {
            Object.keys(model).forEach((key) => this.activeModel[key] = model[key]);
        },
        clearModel() {
            Object.keys(this.activeModel).forEach((key) => this.activeModel[key] = undefined);
        },
        updateProgress(progressPerc, progressText) {
            this.activeModel.progressPerc = progressPerc;
            this.activeModel.progressText = progressText;
        },
        destroyActiveNotification() {
            this.clearModel();
            activeNotification.off('destroy', this.destroyActiveNotification);
            activeNotification = undefined;
        },
        dismiss() {
            if (activeNotification.model.severity === 'info') {
                activeNotification.dismiss();
            } else {
                this.openmct.notifications._minimize(activeNotification);
            }
        },
        minimized() {
            this.activeModel.minimized = true;
            activeNotification.off('progress', this.updateProgress);
            activeNotification.off('minimized', this.minimized);

            activeNotification.off('progress', updateMaxProgressBar);
            activeNotification.off('minimized', dismissMaximizedDialog);
            activeNotification.off('destroy', dismissMaximizedDialog);
        },
        maximize() {
            if (this.haslink) {
                const linkProps = this.getLinkProps;
                linkProps.onClick();

                activeNotification.dismiss();

                return;
            }

            if (this.activeModel.progressPerc !== undefined) {
                maximizedDialog = this.openmct.overlays.progressDialog({
                    buttons: [minimizeButton],
                    ...this.activeModel
                });

                activeNotification.on('progress', updateMaxProgressBar);
                activeNotification.on('minimized', dismissMaximizedDialog);
                activeNotification.on('destroy', dismissMaximizedDialog);

            } else {
                maximizedDialog = this.openmct.overlays.dialog({
                    iconClass: this.activeModel.severity,
                    buttons: [minimizeButton],
                    ...this.activeModel
                });
            }
        }
    }
};
</script>
