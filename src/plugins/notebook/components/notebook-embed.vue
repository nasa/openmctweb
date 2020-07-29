<template>
<div class="c-snapshot c-ne__embed">
    <div v-if="embed.snapshot"
         class="c-ne__embed__snap-thumb"
         @click="openSnapshot()"
    >
        <img :src="embed.snapshot.src">
    </div>
    <div class="c-ne__embed__info">
        <div class="c-ne__embed__name">
            <a class="c-ne__embed__link"
               :class="embed.cssClass"
               @click="changeLocation"
            >{{ embed.name }}</a>
            <PopupMenu :popup-menu-items="popupMenuItems" />
        </div>
        <div v-if="embed.snapshot"
             class="c-ne__embed__time"
        >
            {{ formatTime(embed.createdOn, 'YYYY-MM-DD HH:mm:ss') }}
        </div>
    </div>
</div>
</template>

<script>
import Moment from 'moment';
import PopupMenu from './popup-menu.vue';
import PreviewAction from '../../../ui/preview/PreviewAction';
import Painterro from 'painterro';
import RemoveDialog from '../utils/removeDialog';
import SnapshotTemplate from './snapshot-template.html';
import ViewportService from '../../plot/src/services/ViewportService';
import Vue from 'vue';

export default {
    inject: ['openmct'],
    components: {
        PopupMenu
    },
    props: {
        embed: {
            type: Object,
            default() {
                return {};
            }
        },
        removeActionString: {
            type: String,
            default() {
                return 'Remove This Embed';
            }
        }
    },
    data() {
        return {
            popupMenuItems: []
        }
    },
    watch: {
    },
    mounted() {
        this.addPopupMenuItems();
        this.exportImageService = this.openmct.$injector.get('exportImageService');
    },
    methods: {
        addPopupMenuItems() {
            const removeEmbed = {
                cssClass: 'icon-trash',
                name: this.removeActionString,
                callback: this.getRemoveDialog.bind(this)
            }
            const preview = {
                cssClass: 'icon-eye-open',
                name: 'Preview',
                callback: this.previewEmbed.bind(this)
            }

            this.popupMenuItems = [removeEmbed, preview];
        },
        annotateSnapshot() {
            const self = this;

            let save = false;
            let painterroInstance = {};
            const annotateVue = new Vue({
                template: '<div id="snap-annotation"></div>'
            });

            let annotateOverlay = self.openmct.overlays.overlay({
                element: annotateVue.$mount().$el,
                size: 'large',
                dismissable: false,
                buttons: [
                    {
                        label: 'Cancel',
                        callback: function () {
                            save = false;
                            painterroInstance.save();
                            annotateOverlay.dismiss();
                        }
                    },
                    {
                        label: 'Save',
                        callback: function () {

                            save = true;
                            painterroInstance.save();
                            annotateOverlay.dismiss();
                        }
                    }
                ],
                onDestroy: function () {
                    annotateVue.$destroy(true);
                }
            });

            painterroInstance = Painterro({
                id: 'snap-annotation',
                activeColor: '#ff0000',
                activeColorAlpha: 1.0,
                activeFillColor: '#fff',
                activeFillColorAlpha: 0.0,
                backgroundFillColor: '#000',
                backgroundFillColorAlpha: 0.0,
                defaultFontSize: 16,
                defaultLineWidth: 2,
                defaultTool: 'ellipse',
                hiddenTools: ['save', 'open', 'close', 'eraser', 'pixelize', 'rotate', 'settings', 'resize'],
                translation: {
                    name: 'en',
                    strings: {
                        lineColor: 'Line',
                        fillColor: 'Fill',
                        lineWidth: 'Size',
                        textColor: 'Color',
                        fontSize: 'Size',
                        fontStyle: 'Style'
                    }
                },
                saveHandler: function (image, done) {
                    if (save) {
                        const url = image.asBlob();
                        const reader = new window.FileReader();
                        reader.readAsDataURL(url);
                        reader.onloadend = function () {
                            const snapshot = reader.result;
                            const snapshotObject = {
                                src: snapshot,
                                type: url.type,
                                size: url.size,
                                modified: Date.now()
                            };

                            self.embed.snapshot = snapshotObject;
                            self.updateEmbed(self.embed);
                        };
                    } else {
                        console.log('You cancelled the annotation!!!');
                    }

                    done(true);
                }
            }).show(this.embed.snapshot.src);
        },
        changeLocation() {
            const link = this.embed.historicLink;
            if (!link) {
                return;
            }

            const bounds = this.openmct.time.bounds();
            const isTimeBoundChanged = this.embed.bounds.start !== bounds.start
                || this.embed.bounds.end !== bounds.end;
            const isFixedTimespanMode = !this.openmct.time.clock();

            this.openmct.time.stopClock();
            let message = '';
            if (isTimeBoundChanged) {
                this.openmct.time.bounds({
                    start: this.embed.bounds.start,
                    end: this.embed.bounds.end
                });
                message = 'Time bound values changed';
            }

            if (!isFixedTimespanMode) {
                message = 'Time bound values changed to fixed timespan mode';
            }

            if (message.length) {
                this.openmct.notifications.alert(message);
            }

            window.location.href = link;
        },
        formatTime(unixTime, timeFormat) {
            return Moment.utc(unixTime).format(timeFormat);
        },
        getRemoveDialog() {
            const options = {
                name: this.removeActionString,
                callback: this.removeEmbed.bind(this)
            }
            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
        },
        openSnapshot() {
            const self = this;
            this.snapshot = new Vue({
                data: () => {
                    return {
                        embed: self.embed
                    };
                },
                methods: {
                    formatTime: self.formatTime,
                    annotateSnapshot: self.annotateSnapshot,
                    exportImage: self.exportImage
                },
                template: SnapshotTemplate
            });

            const snapshotOverlay = this.openmct.overlays.overlay({
                element: this.snapshot.$mount().$el,
                onDestroy: () => { this.snapshot.$destroy(true) },
                size: 'large',
                dismissable: true,
                buttons: [
                    {
                        label: 'Done',
                        emphasis: true,
                        callback: () => {
                            snapshotOverlay.dismiss();
                        }
                    }
                ]
            });
        },
        exportImage(type) {
            let element = this.snapshot.$refs['snapshot-image'];

            if (type === 'png') {
                this.exportImageService.exportPNG(element, this.embed.name);
            } else {
                this.exportImageService.exportJPG(element, this.embed.name);
            }
        },
        previewEmbed() {
            const self = this;
            const previewAction = new PreviewAction(self.openmct);
            previewAction.invoke(JSON.parse(self.embed.objectPath));

            //set the plot viewport
            if ('viewportBounds' in self.embed) {
                let svc = new ViewportService(self.openmct);
                Object.keys(self.embed.viewportBounds).forEach(function (childIndex) {
                    svc.setBounds(childIndex, self.embed.viewportBounds[childIndex]);
                });
            }
        },
        removeEmbed(success) {
            if (!success) {
                return;
            }

            this.$emit('removeEmbed', this.embed.id);
        },
        updateEmbed(embed) {
            this.$emit('updateEmbed', embed);
        }
    }
}
</script>
