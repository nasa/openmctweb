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
<div class="c-notebook">
    <div class="c-notebook__head">
        <Search class="c-notebook__search"
                :value="search"
                @input="search = $event"
                @clear="resetSearch()"
        />
    </div>
    <SearchResults v-if="search.length"
                   ref="searchResults"
                   :domain-object="internalDomainObject"
                   :results="searchResults"
                   @changeSectionPage="changeSelectedSection"
                   @updateEntries="updateEntries"
    />
    <div v-if="!search.length"
         class="c-notebook__body"
    >
        <Sidebar ref="sidebar"
                 class="c-notebook__nav c-sidebar c-drawer c-drawer--align-left"
                 :class="[{'is-expanded': showNav}, {'c-drawer--push': !sidebarCoversEntries}, {'c-drawer--overlays': sidebarCoversEntries}]"
                 :default-page-id="defaultPageId"
                 :default-section-id="defaultSectionId"
                 :domain-object="internalDomainObject"
                 :page-title="internalDomainObject.configuration.pageTitle"
                 :section-title="internalDomainObject.configuration.sectionTitle"
                 :sections="sections"
                 :selected-section="selectedSection"
                 :sidebar-covers-entries="sidebarCoversEntries"
                 @pagesChanged="pagesChanged"
                 @sectionsChanged="sectionsChanged"
                 @toggleNav="toggleNav"
        />
        <div class="c-notebook__page-view">
            <div class="c-notebook__page-view__header">
                <button class="c-notebook__toggle-nav-button c-icon-button c-icon-button--major icon-menu-hamburger"
                        @click="toggleNav"
                ></button>
                <div class="c-notebook__page-view__path c-path">
                    <span class="c-notebook__path__section c-path__item">
                        {{ getSelectedSection() ? getSelectedSection().name : '' }}
                    </span>
                    <span class="c-notebook__path__page c-path__item">
                        {{ getSelectedPage() ? getSelectedPage().name : '' }}
                    </span>
                </div>
                <div class="c-notebook__page-view__controls">
                    <select v-model="showTime"
                            class="c-notebook__controls__time"
                    >
                        <option value="0"
                                :selected="showTime === 0"
                        >
                            Show all
                        </option>
                        <option value="1"
                                :selected="showTime === 1"
                        >Last hour</option>
                        <option value="8"
                                :selected="showTime === 8"
                        >Last 8 hours</option>
                        <option value="24"
                                :selected="showTime === 24"
                        >Last 24 hours</option>
                    </select>
                    <select v-model="defaultSort"
                            class="c-notebook__controls__time"
                    >
                        <option value="newest"
                                :selected="defaultSort === 'newest'"
                        >Newest first</option>
                        <option value="oldest"
                                :selected="defaultSort === 'oldest'"
                        >Oldest first</option>
                    </select>
                </div>
            </div>
            <div class="c-notebook__drag-area icon-plus"
                 @click="newEntry()"
                 @dragover="dragOver"
                 @drop.capture="dropCapture"
                 @drop="dropOnEntry($event)"
            >
                <span class="c-notebook__drag-area__label">
                    To start a new entry, click here or drag and drop any object
                </span>
            </div>
            <div v-if="selectedSection && selectedPage"
                 ref="notebookEntries"
                 class="c-notebook__entries"
            >
                <NotebookEntry v-for="entry in filteredAndSortedEntries"
                               :key="entry.id"
                               :entry="entry"
                               :domain-object="internalDomainObject"
                               :selected-page="getSelectedPage()"
                               :selected-section="getSelectedSection()"
                               :read-only="false"
                               @deleteEntry="deleteEntry"
                               @updateEntry="updateEntry"
                />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import NotebookEntry from './NotebookEntry.vue';
import Search from '@/ui/components/search.vue';
import SearchResults from './SearchResults.vue';
import Sidebar from './Sidebar.vue';
import { clearDefaultNotebook, getDefaultNotebook, setDefaultNotebook, setDefaultNotebookSection, setDefaultNotebookPage } from '../utils/notebook-storage';
import { addNotebookEntry, createNewEmbed, getEntryPosById, getNotebookEntries, mutateObject } from '../utils/notebook-entries';
import objectUtils from 'objectUtils';

import { debounce } from 'lodash';
import objectLink from '../../../ui/mixins/object-link';

function objectCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export default {
    components: {
        NotebookEntry,
        Search,
        SearchResults,
        Sidebar
    },
    inject: ['openmct', 'domainObject', 'snapshotContainer'],
    data() {
        return {
            defaultPageId: getDefaultNotebook() ? getDefaultNotebook().page.id : '',
            defaultSectionId: getDefaultNotebook() ? getDefaultNotebook().section.id : '',
            defaultSort: this.domainObject.configuration.defaultSort,
            focusEntryId: null,
            internalDomainObject: this.domainObject,
            search: '',
            searchResults: [],
            showTime: 0,
            showNav: false,
            sidebarCoversEntries: false
        };
    },
    computed: {
        filteredAndSortedEntries() {
            const filterTime = Date.now();
            const pageEntries = getNotebookEntries(this.internalDomainObject, this.selectedSection, this.selectedPage) || [];

            const hours = parseInt(this.showTime, 10);
            const filteredPageEntriesByTime = hours
                ? pageEntries.filter(entry => (filterTime - entry.createdOn) <= hours * 60 * 60 * 1000)
                : pageEntries;

            return this.defaultSort === 'oldest'
                ? filteredPageEntriesByTime
                : [...filteredPageEntriesByTime].reverse();
        },
        pages() {
            return this.getPages() || [];
        },
        sections() {
            return this.internalDomainObject.configuration.sections || [];
        },
        selectedPage() {
            const pages = this.getPages();
            if (!pages) {
                return null;
            }

            return pages.find(page => page.isSelected);
        },
        selectedSection() {
            if (!this.sections.length) {
                return null;
            }

            return this.sections.find(section => section.isSelected);
        }
    },
    watch: {
        search() {
            this.getSearchResults();
        }
    },
    beforeMount() {
        this.getSearchResults = debounce(this.getSearchResults, 500);
    },
    mounted() {
        this.unlisten = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);
        this.formatSidebar();

        window.addEventListener('orientationchange', this.formatSidebar);
        window.addEventListener("hashchange", this.navigateToSectionPage, false);

        this.navigateToSectionPage();
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }

        window.removeEventListener('orientationchange', this.formatSidebar);
        window.removeEventListener("hashchange", this.navigateToSectionPage);
    },
    updated: function () {
        this.$nextTick(() => {
            this.focusOnEntryId();
        });
    },
    methods: {
        changeSelectedSection({ sectionId, pageId }) {
            const sections = this.sections.map(s => {
                s.isSelected = false;

                if (s.id === sectionId) {
                    s.isSelected = true;
                }

                s.pages.forEach((p, i) => {
                    p.isSelected = false;

                    if (pageId && pageId === p.id) {
                        p.isSelected = true;
                    }

                    if (!pageId && i === 0) {
                        p.isSelected = true;
                    }
                });

                return s;
            });

            this.sectionsChanged({ sections });
            this.resetSearch();
        },
        createNotebookStorageObject() {
            const notebookMeta = {
                name: this.internalDomainObject.name,
                identifier: this.internalDomainObject.identifier,
                link: this.getLinktoNotebook()
            };
            const page = this.getSelectedPage();
            const section = this.getSelectedSection();

            return {
                notebookMeta,
                page,
                section
            };
        },
        deleteEntry(entryId) {
            const self = this;
            const entryPos = getEntryPosById(entryId, this.internalDomainObject, this.selectedSection, this.selectedPage);
            if (entryPos === -1) {
                this.openmct.notifications.alert('Warning: unable to delete entry');
                console.error(`unable to delete entry ${entryId} from section ${this.selectedSection}, page ${this.selectedPage}`);

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
                            const entries = getNotebookEntries(self.internalDomainObject, self.selectedSection, self.selectedPage);
                            entries.splice(entryPos, 1);
                            self.updateEntries(entries);
                            dialog.dismiss();
                        }
                    },
                    {
                        label: "Cancel",
                        callback: () => dialog.dismiss()
                    }
                ]
            });
        },
        dragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        },
        dropCapture(event) {
            const isEditing = this.openmct.editor.isEditing();
            if (isEditing) {
                this.openmct.editor.cancel();
            }
        },
        dropOnEntry(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            const snapshotId = event.dataTransfer.getData('openmct/snapshot/id');
            if (snapshotId.length) {
                const snapshot = this.snapshotContainer.getSnapshot(snapshotId);
                this.newEntry(snapshot);
                this.snapshotContainer.removeSnapshot(snapshotId);

                return;
            }

            const data = event.dataTransfer.getData('openmct/domain-object-path');
            const objectPath = JSON.parse(data);
            const bounds = this.openmct.time.bounds();
            const snapshotMeta = {
                bounds,
                link: null,
                objectPath,
                openmct: this.openmct
            };
            const embed = createNewEmbed(snapshotMeta);
            this.newEntry(embed);
        },
        focusOnEntryId() {
            if (!this.focusEntryId) {
                return;
            }

            const element = this.$refs.notebookEntries.querySelector(`#${this.focusEntryId}`);

            if (!element) {
                return;
            }

            element.focus();
            this.focusEntryId = null;
        },
        formatSidebar() {
            /*
                Determine if the sidebar should slide over content, or compress it
                Slide over checks:
                - phone (all orientations)
                - tablet portrait
                - in a layout frame (within .c-so-view)
            */
            const classList = document.querySelector('body').classList;
            const isPhone = Array.from(classList).includes('phone');
            const isTablet = Array.from(classList).includes('tablet');
            const isPortrait = window.screen.orientation.type.includes('portrait');
            const isInLayout = Boolean(this.$el.closest('.c-so-view'));
            const sidebarCoversEntries = (isPhone || (isTablet && isPortrait) || isInLayout);
            this.sidebarCoversEntries = sidebarCoversEntries;
        },
        getDefaultNotebookObject() {
            const oldNotebookStorage = getDefaultNotebook();
            if (!oldNotebookStorage) {
                return null;
            }

            return this.openmct.objects.get(oldNotebookStorage.notebookMeta.identifier);
        },
        getLinktoNotebook() {
            const objectPath = this.openmct.router.path;
            const link = objectLink.computed.objectLink.call({
                objectPath,
                openmct: this.openmct
            });

            const selectedSection = this.selectedSection;
            const selectedPage = this.selectedPage;
            const sectionId = selectedSection ? selectedSection.id : '';
            const pageId = selectedPage ? selectedPage.id : '';

            return `${link}?sectionId=${sectionId}&pageId=${pageId}`;
        },
        getPage(section, id) {
            return section.pages.find(p => p.id === id);
        },
        getSection(id) {
            return this.sections.find(s => s.id === id);
        },
        getSearchResults() {
            if (!this.search.length) {
                return [];
            }

            const output = [];
            const sections = this.internalDomainObject.configuration.sections;
            const entries = this.internalDomainObject.configuration.entries;
            const searchTextLower = this.search.toLowerCase();
            const originalSearchText = this.search;
            let sectionTrackPageHit;
            let pageTrackEntryHit;
            let sectionTrackEntryHit;

            sections.forEach(section => {
                const pages = section.pages;
                let resultMetadata = {
                    originalSearchText,
                    sectionHit: section.name && section.name.toLowerCase().includes(searchTextLower)
                };
                sectionTrackPageHit = false;
                sectionTrackEntryHit = false;

                pages.forEach(page => {
                    resultMetadata.pageHit = page.name && page.name.toLowerCase().includes(searchTextLower);
                    pageTrackEntryHit = false;

                    if (resultMetadata.pageHit) {
                        sectionTrackPageHit = true;
                    }

                    // check for no entries first
                    if (entries[section.id] && entries[section.id][page.id]) {
                        const pageEntries = entries[section.id][page.id];

                        pageEntries.forEach(entry => {
                            const entryHit = entry.text && entry.text.toLowerCase().includes(searchTextLower);

                            // any entry hit goes in, it's the most unique of the hits
                            if (entryHit) {
                                resultMetadata.entryHit = entryHit;
                                pageTrackEntryHit = true;
                                sectionTrackEntryHit = true;

                                output.push(objectCopy({
                                    metadata: resultMetadata,
                                    section,
                                    page,
                                    entry
                                }));
                            }
                        });
                    }

                    // all entries checked, now in pages,
                    // if page hit, but not in results, need to add
                    if (resultMetadata.pageHit && !pageTrackEntryHit) {
                        resultMetadata.entryHit = false;

                        output.push(objectCopy({
                            metadata: resultMetadata,
                            section,
                            page
                        }));
                    }

                });

                // all pages checked, now in sections,
                // if section hit, but not in results, need to add and default page
                if (resultMetadata.sectionHit && !sectionTrackPageHit && !sectionTrackEntryHit) {
                    resultMetadata.entryHit = false;
                    resultMetadata.pageHit = false;

                    output.push(objectCopy({
                        metadata: resultMetadata,
                        section,
                        page: pages[0]
                    }));
                }

            });

            this.searchResults = output;
        },
        getPages() {
            const selectedSection = this.getSelectedSection();
            if (!selectedSection || !selectedSection.pages.length) {
                return [];
            }

            return selectedSection.pages;
        },
        getSelectedPage() {
            const pages = this.getPages();
            if (!pages) {
                return null;
            }

            const selectedPage = pages.find(page => page.isSelected);
            if (selectedPage) {
                return selectedPage;
            }

            if (!selectedPage && !pages.length) {
                return null;
            }

            pages[0].isSelected = true;

            return pages[0];
        },
        getSelectedSection() {
            if (!this.sections.length) {
                return null;
            }

            return this.sections.find(section => section.isSelected);
        },
        navigateToSectionPage() {
            const { pageId, sectionId } = this.openmct.router.getParams();
            if (!pageId || !sectionId) {
                return;
            }

            const sections = this.sections.map(s => {
                s.isSelected = false;
                if (s.id === sectionId) {
                    s.isSelected = true;
                    s.pages.forEach(p => p.isSelected = (p.id === pageId));
                }

                return s;
            });

            const selectedSectionId = this.selectedSection && this.selectedSection.id;
            const selectedPageId = this.selectedPage && this.selectedPage.id;
            if (selectedPageId === pageId && selectedSectionId === sectionId) {
                return;
            }

            this.sectionsChanged({ sections });
        },
        newEntry(embed = null) {
            this.resetSearch();
            const notebookStorage = this.createNotebookStorageObject();
            this.updateDefaultNotebook(notebookStorage);
            const id = addNotebookEntry(this.openmct, this.internalDomainObject, notebookStorage, embed);
            this.focusEntryId = id;
        },
        orientationChange() {
            this.formatSidebar();
        },
        pagesChanged({ pages = [], id = null}) {
            const selectedSection = this.getSelectedSection();
            if (!selectedSection) {
                return;
            }

            selectedSection.pages = pages;
            const sections = this.sections.map(section => {
                if (section.id === selectedSection.id) {
                    section = selectedSection;
                }

                return section;
            });

            this.sectionsChanged({ sections });
            this.updateDefaultNotebookPage(pages, id);
        },
        removeDefaultClass(domainObject) {
            if (!domainObject) {
                return;
            }

            this.openmct.status.delete(domainObject.identifier);
        },
        resetSearch() {
            this.search = '';
            this.searchResults = [];
        },
        toggleNav() {
            this.showNav = !this.showNav;
        },
        async updateDefaultNotebook(notebookStorage) {
            const defaultNotebookObject = await this.getDefaultNotebookObject();
            if (!defaultNotebookObject) {
                setDefaultNotebook(this.openmct, notebookStorage, this.internalDomainObject);
            } else if (objectUtils.makeKeyString(defaultNotebookObject.identifier) !== objectUtils.makeKeyString(notebookStorage.notebookMeta.identifier)) {
                this.removeDefaultClass(defaultNotebookObject);
                setDefaultNotebook(this.openmct, notebookStorage, this.internalDomainObject);
            }

            if (this.defaultSectionId && this.defaultSectionId.length === 0 || this.defaultSectionId !== notebookStorage.section.id) {
                this.defaultSectionId = notebookStorage.section.id;
                setDefaultNotebookSection(notebookStorage.section);
            }

            if (this.defaultPageId && this.defaultPageId.length === 0 || this.defaultPageId !== notebookStorage.page.id) {
                this.defaultPageId = notebookStorage.page.id;
                setDefaultNotebookPage(notebookStorage.page);
            }
        },
        updateDefaultNotebookPage(pages, id) {
            if (!id) {
                return;
            }

            const notebookStorage = getDefaultNotebook();
            if (!notebookStorage
                    || notebookStorage.notebookMeta.identifier.key !== this.internalDomainObject.identifier.key) {
                return;
            }

            const defaultNotebookPage = notebookStorage.page;
            const page = pages.find(p => p.id === id);
            if (!page && defaultNotebookPage.id === id) {
                this.defaultSectionId = null;
                this.defaultPageId = null;
                this.removeDefaultClass(this.internalDomainObject);
                clearDefaultNotebook();

                return;
            }

            if (id !== defaultNotebookPage.id) {
                return;
            }

            setDefaultNotebookPage(page);
        },
        updateDefaultNotebookSection(sections, id) {
            if (!id) {
                return;
            }

            const notebookStorage = getDefaultNotebook();
            if (!notebookStorage
                    || notebookStorage.notebookMeta.identifier.key !== this.internalDomainObject.identifier.key) {
                return;
            }

            const defaultNotebookSection = notebookStorage.section;
            const section = sections.find(s => s.id === id);
            if (!section && defaultNotebookSection.id === id) {
                this.defaultSectionId = null;
                this.defaultPageId = null;
                this.removeDefaultClass(this.internalDomainObject);
                clearDefaultNotebook();

                return;
            }

            if (id !== defaultNotebookSection.id) {
                return;
            }

            setDefaultNotebookSection(section);
        },
        updateEntry(entry) {
            const entries = getNotebookEntries(this.internalDomainObject, this.selectedSection, this.selectedPage);
            const entryPos = getEntryPosById(entry.id, this.internalDomainObject, this.selectedSection, this.selectedPage);
            entries[entryPos] = entry;

            this.updateEntries(entries);
        },
        updateEntries(entries) {
            const configuration = this.internalDomainObject.configuration;
            const notebookEntries = configuration.entries || {};
            notebookEntries[this.selectedSection.id][this.selectedPage.id] = entries;

            mutateObject(this.openmct, this.internalDomainObject, 'configuration.entries', notebookEntries);
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        },
        updateParams(sections) {
            const selectedSection = sections.find(s => s.isSelected);
            if (!selectedSection) {
                return;
            }

            const selectedPage = selectedSection.pages.find(p => p.isSelected);
            if (!selectedPage) {
                return;
            }

            const sectionId = selectedSection.id;
            const pageId = selectedPage.id;

            if (!sectionId || !pageId) {
                return;
            }

            this.openmct.router.updateParams({
                sectionId,
                pageId
            });
        },
        sectionsChanged({ sections, id = null }) {
            mutateObject(this.openmct, this.internalDomainObject, 'configuration.sections', sections);

            this.updateParams(sections);
            this.updateDefaultNotebookSection(sections, id);
        }
    }
};
</script>
