<template>
<div class="c-snapshots-h">
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <div class="l-browse-bar__object-name--w">
                <div class="l-browse-bar__object-name c-object-label">
                    <div class="c-object-label__type-icon icon-camera"></div>
                    <div class="c-object-label__name">
                        Notebook Snapshots
                        <span v-if="snapshots.length"
                              class="l-browse-bar__object-details"
                        >&nbsp;{{ snapshots.length }} of {{ getNotebookSnapshotMaxCount() }}
                        </span>
                    </div>
                </div>
                <PopupMenu v-if="snapshots.length > 0"
                           :popup-menu-items="popupMenuItems"
                />
            </div>

        </div>
        <div class="l-browse-bar__end">
            <button class="c-click-icon c-click-icon--major icon-x"
                    @click="close"
            ></button>
        </div>
    </div><!-- closes l-browse-bar -->
    <div class="c-snapshots">
        <span v-for="snapshot in snapshots"
              :key="snapshot.id"
              draggable="true"
              @dragstart="startEmbedDrag(snapshot, $event)"
        >
            <NotebookEmbed ref="notebookEmbed"
                           :key="snapshot.id"
                           :embed="snapshot"
                           :remove-action-string="'Delete Snapshot'"
                           @updateEmbed="updateSnapshot"
                           @removeEmbed="removeSnapshot"
            />
        </span>
        <div v-if="!snapshots.length > 0"
             class="hint"
        >
            There are no Notebook Snapshots currently.
        </div>
    </div>
</div>
</template>

<script>
import NotebookEmbed from './NotebookEmbed.vue';
import PopupMenu from './PopupMenu.vue';
import RemoveDialog from '../utils/removeDialog';
import { NOTEBOOK_SNAPSHOT_MAX_COUNT } from '../snapshot-container';
import { EVENT_SNAPSHOTS_UPDATED } from '../notebook-constants';

export default {
    components: {
        NotebookEmbed,
        PopupMenu
    },
    inject: ['openmct', 'snapshotContainer'],
    props: {
        toggleSnapshot: {
            type: Function,
            default() {
                return () => {};
            }
        }
    },
    data() {
        return {
            popupMenuItems: [],
            removeActionString: 'Delete all snapshots',
            snapshots: []
        };
    },
    mounted() {
        this.addPopupMenuItems();
        this.snapshotContainer.on(EVENT_SNAPSHOTS_UPDATED, this.snapshotsUpdated);
        this.snapshots = this.snapshotContainer.getSnapshots();
    },
    methods: {
        addPopupMenuItems() {
            const removeSnapshot = {
                cssClass: 'icon-trash',
                name: this.removeActionString,
                callback: this.getRemoveDialog.bind(this)
            };

            this.popupMenuItems = [removeSnapshot];
        },
        close() {
            this.toggleSnapshot();
        },
        getNotebookSnapshotMaxCount() {
            return NOTEBOOK_SNAPSHOT_MAX_COUNT;
        },
        getRemoveDialog() {
            const options = {
                name: this.removeActionString,
                callback: this.removeAllSnapshots.bind(this)
            };
            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
        },
        removeAllSnapshots(success) {
            if (!success) {
                return;
            }

            this.snapshotContainer.removeAllSnapshots();
        },
        removeSnapshot(id) {
            this.snapshotContainer.removeSnapshot(id);
        },
        snapshotsUpdated() {
            this.snapshots = this.snapshotContainer.getSnapshots();
        },
        startEmbedDrag(snapshot, event) {
            event.dataTransfer.setData('text/plain', snapshot.id);
            event.dataTransfer.setData('openmct/snapshot/id', snapshot.id);
        },
        updateSnapshot(snapshot) {
            this.snapshotContainer.updateSnapshot(snapshot);
        }
    }
};
</script>
