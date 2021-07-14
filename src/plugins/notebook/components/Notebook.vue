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
                   :domain-object="domainObject"
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
                 :selected-page-id="getSelectedPageId()"
                 :default-section-id="defaultSectionId"
                 :selected-section-id="getSelectedSectionId()"
                 :domain-object="domainObject"
                 :page-title="domainObject.configuration.pageTitle"
                 :section-title="domainObject.configuration.sectionTitle"
                 :sections="sections"
                 :sidebar-covers-entries="sidebarCoversEntries"
                 @defaultPageDeleted="cleanupDefaultNotebook"
                 @defaultSectionDeleted="cleanupDefaultNotebook"
                 @pagesChanged="pagesChanged"
                 @selectPage="selectPage"
                 @sectionsChanged="sectionsChanged"
                 @selectSection="selectSection"
                 @toggleNav="toggleNav"
        />
        <div class="c-notebook__page-view">
            <div class="c-notebook__page-view__header">
                <button class="c-notebook__toggle-nav-button c-icon-button c-icon-button--major icon-menu-hamburger"
                        @click="toggleNav"
                ></button>
                <div class="c-notebook__page-view__path c-path">
                    <span class="c-notebook__path__section c-path__item">
                        {{ selectedSection ? selectedSection.name : '' }}
                    </span>
                    <span class="c-notebook__path__page c-path__item">
                        {{ selectedPage ? selectedPage.name : '' }}
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
                               :domain-object="domainObject"
                               :selected-page="selectedPage"
                               :selected-section="selectedSection"
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
import { clearDefaultNotebook, getDefaultNotebook, setDefaultNotebook, setDefaultNotebookSectionId, setDefaultNotebookPageId } from '../utils/notebook-storage';
import { addNotebookEntry, createNewEmbed, getEntryPosById, getNotebookEntries, mutateObject } from '../utils/notebook-entries';
import { NOTEBOOK_VIEW_TYPE } from '../notebook-constants';
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
    inject: ['openmct', 'snapshotContainer'],
    props: {
        domainObject: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            defaultPageId: this.getDefaultPageId(),
            defaultSectionId: this.getDefaultSectionId(),
            selectedSectionId: this.getSelectedSectionId(),
            selectedPageId: this.getSelectedPageId(),
            defaultSort: this.domainObject.configuration.defaultSort,
            focusEntryId: null,
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
            const pageEntries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage) || [];

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
            return this.getSections();
        },
        selectedPage() {
            const pages = this.getPages();
            if (!pages.length) {
                return undefined;
            }

            const selectedPage = pages.find(page => page.id === this.selectedPageId);
            if (selectedPage) {
                return selectedPage;
            }

            const defaultPage = pages.find(page => page.id === this.defaultPageId);
            if (defaultPage) {
                return defaultPage;
            }

            return this.pages[0];
        },
        selectedSection() {
            if (!this.sections.length) {
                return undefined;
            }

            const selectedSection = this.sections.find(section => section.id === this.selectedSectionId);
            if (selectedSection) {
                return selectedSection;
            }

            const defaultSection = this.sections.find(section => section.id === this.defaultSectionId);
            if (defaultSection) {
                return defaultSection;
            }

            return this.sections[0];
        }
    },
    watch: {
        search() {
            this.getSearchResults();
        }
    },
    beforeMount() {
        this.getSearchResults = debounce(this.getSearchResults, 500);
        this.syncUrlWithPageAndSection = debounce(this.syncUrlWithPageAndSection, 100);
    },
    mounted() {
        this.formatSidebar();
        this.setSectionAndPageFromUrl();

        window.addEventListener('orientationchange', this.formatSidebar);
        window.addEventListener('hashchange', this.setSectionAndPageFromUrl);
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }

        window.removeEventListener('orientationchange', this.formatSidebar);
        window.removeEventListener('hashchange', this.setSectionAndPageFromUrl);
    },
    updated: function () {
        this.$nextTick(() => {
            this.focusOnEntryId();
        });
    },
    methods: {
        changeSectionPage(newParams, oldParams, changedParams) {
            if (newParams.view !== NOTEBOOK_VIEW_TYPE) {
                return;
            }

            let pageId = newParams.pageId;
            let sectionId = newParams.sectionId;

            if (!pageId && !sectionId) {
                return;
            }

            this.sections.forEach(section => {
                section.isSelected = Boolean(section.id === sectionId);

                if (section.isSelected) {
                    section.pages.forEach(page => {
                        page.isSelected = Boolean(page.id === pageId);
                    });
                }
            });
        },
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
        cleanupDefaultNotebook() {
            this.defaultPageId = undefined;
            this.defaultSectionId = undefined;
            this.removeDefaultClass(this.domainObject);
            clearDefaultNotebook();
        },
        setSectionAndPageFromUrl() {
            let sectionId = this.getSectionIdFromUrl() || this.getDefaultSectionId() || this.getSelectedSectionId();
            let pageId = this.getPageIdFromUrl() || this.getDefaultPageId() || this.getSelectedPageId();

            this.selectSection(sectionId);
            this.selectPage(pageId);
        },
        createNotebookStorageObject() {
            const page = this.selectedPage;
            const section = this.selectedSection;

            return {
                name: this.domainObject.name,
                identifier: this.domainObject.identifier,
                link: this.getLinktoNotebook(),
                defaultSectionId: section.id,
                defaultPageId: page.id
            };
        },
        deleteEntry(entryId) {
            const entryPos = getEntryPosById(entryId, this.domainObject, this.selectedSection, this.selectedPage);
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
                            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
                            entries.splice(entryPos, 1);
                            this.updateEntries(entries);
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
        getDefaultPageId() {
            return this.isDefaultNotebook()
                ? getDefaultNotebook().defaultPageId
                : undefined;
        },
        isDefaultNotebook() {
            const defaultNotebook = getDefaultNotebook();
            const defaultNotebookIdentifier = defaultNotebook && defaultNotebook.identifier;

            return defaultNotebookIdentifier !== null
                && this.openmct.objects.areIdsEqual(defaultNotebookIdentifier, this.domainObject.identifier);
        },
        getDefaultSectionId() {
            return this.isDefaultNotebook()
                ? getDefaultNotebook().defaultSectionId
                : undefined;
        },
        getDefaultNotebookObject() {
            const oldNotebookStorage = getDefaultNotebook();
            if (!oldNotebookStorage) {
                return null;
            }

            return this.openmct.objects.get(oldNotebookStorage.identifier);
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
        getSections() {
            return this.domainObject.configuration.sections || [];
        },
        getSearchResults() {
            if (!this.search.length) {
                return [];
            }

            const output = [];
            const sections = this.domainObject.configuration.sections;
            const entries = this.domainObject.configuration.entries;
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
            const selectedSection = this.selectedSection;
            if (!selectedSection || !selectedSection.pages.length) {
                return [];
            }

            return selectedSection.pages;
        },
        getSelectedPageId() {
            const page = this.selectedPage;
            if (!page) {
                return undefined;
            }

            return page.id;
        },
        getSelectedSectionId() {
            const section = this.selectedSection;
            if (!section) {
                return undefined;
            }

            return section.id;
        },
        newEntry(embed = null) {
            this.resetSearch();
            const notebookStorage = this.createNotebookStorageObject();
            this.updateDefaultNotebook(notebookStorage);
            const id = addNotebookEntry(this.openmct, this.domainObject, notebookStorage, embed);
            this.focusEntryId = id;
        },
        orientationChange() {
            this.formatSidebar();
        },
        pagesChanged({ pages = [], id = null}) {
            const selectedSection = this.selectedSection;
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
                setDefaultNotebook(this.openmct, notebookStorage, this.domainObject);
            } else if (objectUtils.makeKeyString(defaultNotebookObject.identifier) !== objectUtils.makeKeyString(notebookStorage.identifier)) {
                this.removeDefaultClass(defaultNotebookObject);
                setDefaultNotebook(this.openmct, notebookStorage, this.domainObject);
            }

            if (this.defaultSectionId !== notebookStorage.defaultSectionId) {
                setDefaultNotebookSectionId(notebookStorage.defaultSectionId);
                this.defaultSectionId = notebookStorage.defaultSectionId;
            }

            if (this.defaultPageId !== notebookStorage.defaultPageId) {
                setDefaultNotebookPageId(notebookStorage.defaultPageId);
                this.defaultPageId = notebookStorage.defaultPageId;
            }
        },
        updateDefaultNotebookSection(sections, id) {
            if (!id) {
                return;
            }

            const notebookStorage = getDefaultNotebook();
            if (!notebookStorage
                    || notebookStorage.identifier.key !== this.domainObject.identifier.key) {
                return;
            }

            const defaultNotebookSectionId = notebookStorage.defaultSectionId;
            const section = sections.find(s => s.id === id);
            if (!section && defaultNotebookSectionId === id) {
                this.removeDefaultClass(this.domainObject);
                clearDefaultNotebook();

                return;
            }

            if (id !== defaultNotebookSectionId) {
                return;
            }

            setDefaultNotebookSectionId(defaultNotebookSectionId);
        },
        updateEntry(entry) {
            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            const entryPos = getEntryPosById(entry.id, this.domainObject, this.selectedSection, this.selectedPage);
            entries[entryPos] = entry;

            this.updateEntries(entries);
        },
        updateEntries(entries) {
            const configuration = this.domainObject.configuration;
            const notebookEntries = configuration.entries || {};
            notebookEntries[this.selectedSection.id][this.selectedPage.id] = entries;

            mutateObject(this.openmct, this.domainObject, 'configuration.entries', notebookEntries);
        },
        getPageIdFromUrl() {
            return this.openmct.router.getParams().pageId;
        },
        getSectionIdFromUrl() {
            return this.openmct.router.getParams().sectionId;
        },
        syncUrlWithPageAndSection() {
            this.openmct.router.updateParams({
                pageId: this.selectedPageId,
                sectionId: this.selectedSectionId
            });
        },
        sectionsChanged({ sections, id = undefined }) {
            mutateObject(this.openmct, this.domainObject, 'configuration.sections', sections);
            this.updateDefaultNotebookSection(sections, id);
        },
        selectPage(pageId) {
            if (!pageId) {
                return;
            }

            this.selectedPageId = pageId;
            this.syncUrlWithPageAndSection();
        },
        selectSection(sectionId) {
            if (!sectionId) {
                return;
            }

            this.selectedSectionId = sectionId;

            const pageId = this.selectedSection.pages[0].id;
            this.selectPage(pageId);

            this.syncUrlWithPageAndSection();
        }
    }
};
</script>
