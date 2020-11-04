<template>
<div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
    <button
        class="c-icon-button c-button--menu icon-camera"
        title="Take a Notebook Snapshot"
        @click.stop.prevent="showMenu"
    >
        <span
            title="Take Notebook Snapshot"
            class="c-icon-button__label"
        >
            Snapshot
        </span>
    </button>
</div>
</template>

<script>
import Snapshot from '../snapshot';
import { getDefaultNotebook } from '../utils/notebook-storage';
import { NOTEBOOK_DEFAULT, NOTEBOOK_SNAPSHOT } from '../notebook-constants';

export default {
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            default() {
                return {};
            }
        },
        ignoreLink: {
            type: Boolean,
            default() {
                return false;
            }
        },
        objectPath: {
            type: Array,
            default() {
                return null;
            }
        }
    },
    data() {
        return {
            notebookSnapshot: null
        };
    },
    mounted() {
        this.notebookSnapshot = new Snapshot(this.openmct);
    },
    methods: {
        showMenu(event) {
            const notebookTypes = [];
            const defaultNotebook = getDefaultNotebook();

            if (defaultNotebook) {
                const name = defaultNotebook.notebookMeta.name;
                const sectionName = defaultNotebook.section.name;
                const pageName = defaultNotebook.page.name;
                const defaultPath = `${name} - ${sectionName} - ${pageName}`;

                notebookTypes.push({
                    cssClass: 'icon-notebook',
                    name: `Save to Notebook ${defaultPath}`,
                    callBack: () => this.snapshot(NOTEBOOK_DEFAULT, event.target)
                });
            }

            notebookTypes.push({
                cssClass: 'icon-camera',
                name: 'Save to Notebook Snapshots',
                callBack: () => this.snapshot(NOTEBOOK_SNAPSHOT, event.target)
            });

            const elementBoundingClientRect = this.$el.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y + elementBoundingClientRect.height;
            this.openmct.menus.showMenu(x, y, notebookTypes);
        },
        snapshot(notebookType, target) {
            this.$nextTick(() => {
                let element = target.closest('.js-snapshot-frame') || target.querySelector('.js-snapshot-frame');
                if (!element) {
                    const container = target.closest('.js-snapshot-container');
                    element = container.querySelector('.js-snapshot-frame');
                }

                const bounds = this.openmct.time.bounds();
                const link = !this.ignoreLink
                    ? window.location.hash
                    : null;

                const objectPath = this.objectPath || this.openmct.router.path;
                const snapshotMeta = {
                    bounds,
                    link,
                    objectPath,
                    openmct: this.openmct
                };

                this.notebookSnapshot.capture(snapshotMeta, notebookType, element);
            });
        }
    }
};
</script>
