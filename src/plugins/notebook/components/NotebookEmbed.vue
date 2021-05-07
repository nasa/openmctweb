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
            {{ createdOn }}
        </div>
    </div>
</div>
</template>

<script>
import Moment from 'moment';
import PopupMenu from './PopupMenu.vue';
import PreviewAction from '../../../ui/preview/PreviewAction';
import RemoveDialog from '../utils/removeDialog';
import PainterroInstance from '../utils/painterroInstance';
import SnapshotTemplate from './snapshot-template.html';
import Vue from 'vue';

export default {
    components: {
        PopupMenu
    },
    inject: ['openmct'],
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
        };
    },
    computed: {
        createdOn() {
            return this.formatTime(this.embed.createdOn, 'YYYY-MM-DD HH:mm:ss');
        }
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
            };
            const preview = {
                cssClass: 'icon-eye-open',
                name: 'Preview',
                callback: this.previewEmbed.bind(this)
            };

            this.popupMenuItems = [removeEmbed, preview];
        },
        annotateSnapshot() {
            const annotateVue = new Vue({
                template: '<div id="snap-annotation"></div>'
            }).$mount();

            const painterroInstance = new PainterroInstance(annotateVue.$el, this.updateSnapshot);
            const annotateOverlay = this.openmct.overlays.overlay({
                element: annotateVue.$el,
                size: 'large',
                dismissable: false,
                buttons: [
                    {
                        label: 'Cancel',
                        emphasis: true,
                        callback: () => {
                            painterroInstance.dismiss();
                            annotateOverlay.dismiss();
                        }
                    },
                    {
                        label: 'Save',
                        callback: () => {
                            painterroInstance.save();
                            annotateOverlay.dismiss();
                            this.snapshotOverlay.dismiss();
                            this.openSnapshot();
                        }
                    }
                ],
                onDestroy: () => {
                    annotateVue.$destroy(true);
                }
            });

            painterroInstance.intialize();
            painterroInstance.show(this.embed.snapshot.src);
        },
        changeLocation() {
            const hash = this.embed.historicLink;

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

            const relativeHash = hash.slice(hash.indexOf('#'));
            const url = new URL(relativeHash, `${location.protocol}//${location.host}${location.pathname}`);
            window.location.hash = url.hash;
        },
        formatTime(unixTime, timeFormat) {
            return Moment.utc(unixTime).format(timeFormat);
        },
        getRemoveDialog() {
            const options = {
                name: this.removeActionString,
                callback: this.removeEmbed.bind(this)
            };
            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
        },
        openSnapshot() {
            const self = this;
            this.snapshot = new Vue({
                data: () => {
                    return {
                        createdOn: this.createdOn,
                        embed: this.embed
                    };
                },
                methods: {
                    formatTime: self.formatTime,
                    annotateSnapshot: self.annotateSnapshot,
                    exportImage: self.exportImage
                },
                template: SnapshotTemplate
            }).$mount();

            this.snapshotOverlay = this.openmct.overlays.overlay({
                element: this.snapshot.$el,
                onDestroy: () => this.snapshot.$destroy(true),
                size: 'large',
                dismissable: true,
                buttons: [
                    {
                        label: 'Done',
                        emphasis: true,
                        callback: () => {
                            this.snapshotOverlay.dismiss();
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
            this.openmct.objects.get(self.embed.domainObject.identifier)
                .then(domainObject => previewAction.invoke([domainObject]));
        },
        removeEmbed(success) {
            if (!success) {
                return;
            }

            this.$emit('removeEmbed', this.embed.id);
        },
        updateEmbed(embed) {
            this.$emit('updateEmbed', embed);
        },
        updateSnapshot(snapshotObject) {
            this.embed.snapshot = snapshotObject;
            this.updateEmbed(this.embed);
        }
    }
};
</script>
