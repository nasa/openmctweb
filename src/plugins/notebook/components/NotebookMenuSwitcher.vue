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
import { getDefaultNotebook, validateNotebookStorageObject } from '../utils/notebook-storage';
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
            notebookSnapshot: undefined,
            notebookTypes: []
        };
    },
    mounted() {
        validateNotebookStorageObject();
        this.getDefaultNotebookObject();

        this.notebookSnapshot = new Snapshot(this.openmct);
        this.setDefaultNotebookStatus();
    },
    methods: {
        async getDefaultNotebookObject() {
            const defaultNotebook = getDefaultNotebook();
            const defaultNotebookObject = defaultNotebook && await this.openmct.objects.get(defaultNotebook.notebookMeta.identifier);

            return defaultNotebookObject;
        },
        async showMenu(event) {
            const notebookTypes = [];
            const elementBoundingClientRect = this.$el.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

            const defaultNotebookObject = await this.getDefaultNotebookObject();
            if (defaultNotebookObject) {
                const name = defaultNotebookObject.name;

                const defaultNotebook = getDefaultNotebook();
                const sectionName = defaultNotebook.section.name;
                const pageName = defaultNotebook.page.name;
                const defaultPath = `${name} - ${sectionName} - ${pageName}`;

                notebookTypes.push({
                    cssClass: 'icon-notebook',
                    name: `Save to Notebook ${defaultPath}`,
                    onItemClicked: () => {
                        return this.snapshot(NOTEBOOK_DEFAULT);
                    }
                });
            }

            notebookTypes.push({
                cssClass: 'icon-camera',
                name: 'Save to Notebook Snapshots',
                onItemClicked: () => {
                    return this.snapshot(NOTEBOOK_SNAPSHOT);
                }
            });

            this.openmct.menus.showMenu(x, y, notebookTypes);
        },
        snapshot(notebookType) {
            this.$nextTick(() => {
                const element = document.querySelector('.c-overlay__contents')
                    || document.getElementsByClassName('l-shell__main-container')[0];

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
        },
        setDefaultNotebookStatus() {
            let defaultNotebookObject = getDefaultNotebook();

            if (defaultNotebookObject && defaultNotebookObject.notebookMeta) {
                let notebookIdentifier = defaultNotebookObject.notebookMeta.identifier;

                this.openmct.status.set(notebookIdentifier, 'notebook-default');
            }
        }
    }
};
</script>
