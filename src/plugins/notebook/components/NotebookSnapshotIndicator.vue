<template>
<div class="c-indicator c-indicator--clickable icon-camera"
     :class="[
         { 's-status-off': snapshotCount === 0 },
         { 's-status-on': snapshotCount > 0 },
         { 's-status-caution': snapshotCount === snapshotMaxCount },
         { 'has-new-snapshot': flashIndicator }
     ]"
>
    <span class="label c-indicator__label">
        {{ indicatorTitle }}
        <button @click="toggleSnapshot">
            {{ expanded ? 'Hide' : 'Show' }}
        </button>
    </span>
    <span class="c-indicator__count">{{ snapshotCount }}</span>
</div>
</template>

<script>
import SnapshotContainerComponent from './NotebookSnapshotContainer.vue';
import { EVENT_SNAPSHOTS_UPDATED } from '../notebook-constants';
import { NOTEBOOK_SNAPSHOT_MAX_COUNT } from '../snapshot-container';
import Vue from 'vue';

export default {
    inject: ['openmct', 'snapshotContainer'],
    data() {
        return {
            expanded: false,
            indicatorTitle: '',
            snapshotCount: 0,
            snapshotMaxCount: NOTEBOOK_SNAPSHOT_MAX_COUNT,
            flashIndicator: false
        };
    },
    mounted() {
        this.snapshotContainer.on(EVENT_SNAPSHOTS_UPDATED, this.snapshotsUpdated);
        this.updateSnapshotIndicatorTitle();
    },
    methods: {
        notifyNewSnapshot() {
            this.flashIndicator = true;
            setTimeout(this.removeNotify, 15000);
        },
        removeNotify() {
            this.flashIndicator = false;
        },
        snapshotsUpdated() {
            if (this.snapshotContainer.getSnapshots().length > this.snapshotCount) {
                this.notifyNewSnapshot();
            }

            this.updateSnapshotIndicatorTitle();
        },
        toggleSnapshot() {
            this.expanded = !this.expanded;

            const drawerElement = document.querySelector('.l-shell__drawer');
            drawerElement.classList.toggle('is-expanded');

            this.updateSnapshotContainer();
        },
        updateSnapshotContainer() {
            const { openmct, snapshotContainer } = this;
            const toggleSnapshot = this.toggleSnapshot.bind(this);
            const drawerElement = document.querySelector('.l-shell__drawer');
            drawerElement.innerHTML = '<div></div>';
            const divElement = document.querySelector('.l-shell__drawer div');

            this.component = new Vue({
                el: divElement,
                components: {
                    SnapshotContainerComponent
                },
                provide: {
                    openmct,
                    snapshotContainer
                },
                data() {
                    return {
                        toggleSnapshot
                    };
                },
                template: '<SnapshotContainerComponent :toggleSnapshot="toggleSnapshot"></SnapshotContainerComponent>'
            }).$mount();
        },
        updateSnapshotIndicatorTitle() {
            const snapshotCount = this.snapshotContainer.getSnapshots().length;
            this.snapshotCount = snapshotCount;
            const snapshotTitleSuffix = snapshotCount === 1
                ? 'Snapshot'
                : 'Snapshots';
            this.indicatorTitle = `${snapshotCount} ${snapshotTitleSuffix}`;
        }
    }
};
</script>
