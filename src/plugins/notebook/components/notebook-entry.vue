<template>
<div class="c-notebook__entry c-ne has-local-controls"
     @dragover="dragover"
     @drop.capture="dropCapture"
     @drop.prevent="dropOnEntry(entry.id, $event)"
>
    <div class="c-ne__time-and-content">
        <div class="c-ne__time">
            <span>{{ formatTime(entry.createdOn, 'YYYY-MM-DD') }}</span>
            <span>{{ formatTime(entry.createdOn, 'HH:mm:ss') }}</span>
        </div>
        <div class="c-ne__content">
            <div :id="entry.id"
                 class="c-ne__text"
                 :class="{'c-input-inline' : !readOnly }"
                 :contenteditable="!readOnly"
                 :style="!entry.text.length ? defaultEntryStyle : ''"
                 @blur="textBlur($event, entry.id)"
                 @focus="textFocus($event, entry.id)"
            >{{ entry.text.length ? entry.text : defaultText }}</div>
            <div class="c-snapshots c-ne__embeds">
                <NotebookEmbed v-for="embed in entry.embeds"
                               :key="embed.id"
                               :embed="embed"
                               :entry="entry"
                               @removeEmbed="removeEmbed"
                               @updateEmbed="updateEmbed"
                />
            </div>
        </div>
    </div>
    <div v-if="!readOnly"
         class="c-ne__local-controls--hidden"
    >
        <button class="c-icon-button c-icon-button--major icon-trash"
                title="Delete this entry"
                @click="deleteEntry"
        >
        </button>
    </div>
    <div v-if="readOnly"
         class="c-ne__section-and-page"
    >
        <a class="c-click-link"
           @click="navigateToSection()"
        >
            {{ result.section.name }}
        </a>
        <span class="icon-arrow-right"></span>
        <a class="c-click-link"
           @click="navigateToPage()"
        >
            {{ result.page.name }}
        </a>
    </div>
</div>
</template>

<script>
import NotebookEmbed from './notebook-embed.vue';
import { createNewEmbed, getEntryPosById, getNotebookEntries } from '../utils/notebook-entries';
import Moment from 'moment';

export default {
    inject: ['openmct', 'snapshotContainer'],
    components: {
        NotebookEmbed
    },
    props: {
        domainObject: {
            type: Object,
            default() {
                return {};
            }
        },
        entry: {
            type: Object,
            default() {
                return {};
            }
        },
        result: {
            type: Object,
            default() {
                return {};
            }
        },
        selectedPage: {
            type: Object,
            default() {
                return {};
            }
        },
        selectedSection: {
            type: Object,
            default() {
                return {};
            }
        },
        readOnly: {
            type: Boolean,
            default() {
                return true;
            }
        }
    },
    data() {
        return {
            currentEntryValue: '',
            defaultEntryStyle: {
                fontStyle: 'italic',
                color: '#6e6e6e'
            },
            defaultText: 'add description'
        }
    },
    watch: {
        entry() {
        },
        readOnly(readOnly) {
        },
        selectedSection(selectedSection) {
        },
        selectedPage(selectedSection) {
        }
    },
    mounted() {
        this.updateEntries = this.updateEntries.bind(this);
    },
    beforeDestory() {
    },
    methods: {
        deleteEntry() {
            const self = this;
            if (!self.domainObject || !self.selectedSection || !self.selectedPage || !self.entry.id) {
                return;
            }

            const entryPosById = this.entryPosById(this.entry.id);
            if (entryPosById === -1) {
                return;
            }

            const dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: 'This action will permanently delete this entry. Do you wish to continue?',
                buttons: [
                    {
                        label: "Ok",
                        emphasis: true,
                        callback: () => {
                            const entries = getNotebookEntries(self.domainObject, self.selectedSection, self.selectedPage);
                            entries.splice(entryPosById, 1);
                            this.updateEntries(entries);
                            dialog.dismiss();
                        }
                    },
                    {
                        label: "Cancel",
                        callback: () => {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        },
        dragover() {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        },
        dropCapture(event) {
            const isEditing = this.openmct.editor.isEditing();
            if (isEditing) {
                this.openmct.editor.cancel();
            }
        },
        dropOnEntry(entryId, $event) {
            event.stopImmediatePropagation();

            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const snapshotId = $event.dataTransfer.getData('snapshot/id');
            if (snapshotId.length) {
                this.moveSnapshot(snapshotId);

                return;
            }

            const data = $event.dataTransfer.getData('openmct/domain-object-path');
            const objectPath = JSON.parse(data);
            const entryPos = this.entryPosById(entryId);
            const bounds = this.openmct.time.bounds();
            const snapshotMeta = {
                bounds,
                viewportBounds: null,
                link: null,
                objectPath,
                openmct: this.openmct
            }
            const newEmbed = createNewEmbed(snapshotMeta);
            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            const currentEntryEmbeds = entries[entryPos].embeds;
            currentEntryEmbeds.push(newEmbed);
            this.updateEntries(entries);
        },
        entryPosById(entryId) {
            return getEntryPosById(entryId, this.domainObject, this.selectedSection, this.selectedPage);
        },
        findPositionInArray(array, id) {
            let position = -1;
            array.some((item, index) => {
                const found = item.id === id;
                if (found) {
                    position = index;
                }

                return found;
            });

            return position;
        },
        formatTime(unixTime, timeFormat) {
            return Moment.utc(unixTime).format(timeFormat);
        },
        moveSnapshot(snapshotId) {
            const snapshot = this.snapshotContainer.getSnapshot(snapshotId);
            this.entry.embeds.push(snapshot);
            this.updateEntry(this.entry);
            this.snapshotContainer.removeSnapshot(snapshotId);
        },
        navigateToPage() {
            this.$emit('changeSectionPage', {
                sectionId: this.result.section.id,
                pageId: this.result.page.id
            });
        },
        navigateToSection() {
            this.$emit('changeSectionPage', {
                sectionId: this.result.section.id,
                pageId: null
            });
        },
        removeEmbed(id) {
            const embedPosition = this.findPositionInArray(this.entry.embeds, id);
            this.entry.embeds.splice(embedPosition, 1);
            this.updateEntry(this.entry);
        },
        selectTextInsideElement(element) {
            const range = document.createRange();
            range.selectNodeContents(element);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },
        textBlur($event, entryId) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const target = $event.target;
            if (!target) {
                return;
            }

            const entryPos = this.entryPosById(entryId);
            const value = target.textContent.trim();
            if (this.currentEntryValue !== value) {
                const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
                entries[entryPos].text = value;

                this.updateEntries(entries);
            }
        },
        textFocus($event) {
            if (this.readOnly || !this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const target = $event.target
            this.currentEntryValue = target ? target.innerText : '';

            if (!this.entry.text.length) {
                this.selectTextInsideElement(target);
            }
        },
        updateEmbed(newEmbed) {
            let embed = this.entry.embeds.find(e => e.id === newEmbed.id);

            if (!embed) {
                return;
            }

            embed = newEmbed;
            this.updateEntry(this.entry);
        },
        updateEntry(newEntry) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            entries.forEach(entry => {
                if (entry.id === newEntry.id) {
                    entry = newEntry;
                }
            });

            this.updateEntries(entries);
        },
        updateEntries(entries) {
            this.$emit('updateEntries', entries);
        }
    }
}
</script>
