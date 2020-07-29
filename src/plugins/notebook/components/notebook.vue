<template>
<div class="c-notebook">
    <div class="c-notebook__head">
        <Search class="c-notebook__search"
                :value="search"
                @input="throttledSearchItem"
                @clear="throttledSearchItem"
        />
    </div>
    <SearchResults v-if="search.length"
                   ref="searchResults"
                   :results="getSearchResults()"
                   @changeSectionPage="changeSelectedSection"
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
                 :pages="pages"
                 :section-title="internalDomainObject.configuration.sectionTitle"
                 :sections="sections"
                 :sidebar-covers-entries="sidebarCoversEntries"
                 @updatePage="updatePage"
                 @updateSection="updateSection"
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
                               @updateEntries="updateEntries"
                />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import NotebookEntry from './notebook-entry.vue';
import Search from '@/ui/components/search.vue';
import SearchResults from './search-results.vue';
import Sidebar from './sidebar.vue';
import { clearDefaultNotebook, getDefaultNotebook, setDefaultNotebook, setDefaultNotebookSection, setDefaultNotebookPage } from '../utils/notebook-storage';
import { addNotebookEntry, createNewEmbed, getNotebookEntries } from '../utils/notebook-entries';
import { throttle } from 'lodash';

const DEFAULT_CLASS = 'is-notebook-default';

export default {
    inject: ['openmct', 'domainObject', 'snapshotContainer'],
    components: {
        NotebookEntry,
        Search,
        SearchResults,
        Sidebar
    },
    data() {
        return {
            defaultPageId: getDefaultNotebook() ? getDefaultNotebook().page.id : '',
            defaultSectionId: getDefaultNotebook() ? getDefaultNotebook().section.id : '',
            defaultSort: this.domainObject.configuration.defaultSort,
            focusEntryId: null,
            internalDomainObject: this.domainObject,
            search: '',
            showTime: 0,
            showNav: false,
            sidebarCoversEntries: false
        }
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
    },
    beforeMount() {
        this.throttledSearchItem = throttle(this.searchItem, 500);
    },
    mounted() {
        this.unlisten = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);
        this.formatSidebar();
        window.addEventListener('orientationchange', this.formatSidebar);

        this.navigateToSectionPage();
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }
    },
    updated: function () {
        this.$nextTick(function () {
            this.focusOnEntryId();
        })
    },
    methods: {
        addDefaultClass() {
            const classList = this.internalDomainObject.classList || [];
            if (classList.includes(DEFAULT_CLASS)) {
                return;
            }

            classList.push(DEFAULT_CLASS);
            this.mutateObject('classList', classList);
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

            this.updateSection({ sections });
            this.throttledSearchItem('');
        },
        createNotebookStorageObject() {
            const notebookMeta = {
                name: this.internalDomainObject.name,
                identifier: this.internalDomainObject.identifier
            };
            const page = this.getSelectedPage();
            const section = this.getSelectedSection();

            return {
                domainObject: this.internalDomainObject,
                notebookMeta,
                section,
                page
            }
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

            const snapshotId = event.dataTransfer.getData('snapshot/id');
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
                viewportBounds: null,
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
            const isInLayout = !!this.$el.closest('.c-so-view');
            const sidebarCoversEntries = (isPhone || (isTablet && isPortrait) || isInLayout);
            this.sidebarCoversEntries = sidebarCoversEntries;
        },
        getDefaultNotebookObject() {
            const oldNotebookStorage = getDefaultNotebook();
            if (!oldNotebookStorage) {
                return null;
            }

            return this.openmct.objects.get(oldNotebookStorage.notebookMeta.identifier).then(d => d);
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
            const entries = this.internalDomainObject.configuration.entries;
            const sectionKeys = Object.keys(entries);
            sectionKeys.forEach(sectionKey => {
                const pages = entries[sectionKey];
                const pageKeys = Object.keys(pages);
                pageKeys.forEach(pageKey => {
                    const pageEntries = entries[sectionKey][pageKey];
                    pageEntries.forEach(entry => {
                        if (entry.text && entry.text.toLowerCase().includes(this.search.toLowerCase())) {
                            const section = this.getSection(sectionKey);
                            output.push({
                                section,
                                page: this.getPage(section, pageKey),
                                entry
                            });
                        }
                    });
                });
            });

            return output;
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
        mutateObject(key, value) {
            this.openmct.objects.mutate(this.internalDomainObject, key, value);
        },
        navigateToSectionPage() {
            const { pageId, sectionId } = this.openmct.router.getParams();
            if(!pageId || !sectionId) {
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

            this.updateSection({ sections });
        },
        newEntry(embed = null) {
            this.search = '';
            const notebookStorage = this.createNotebookStorageObject();
            this.updateDefaultNotebook(notebookStorage);
            const id = addNotebookEntry(this.openmct, this.internalDomainObject, notebookStorage, embed);
            this.focusEntryId = id;
            this.search = '';
        },
        orientationChange() {
            this.formatSidebar();
        },
        removeDefaultClass(domainObject) {
            if (!domainObject) {
                return;
            }

            const classList = domainObject.classList || [];
            const index = classList.indexOf(DEFAULT_CLASS);
            if (!classList.length || index < 0) {
                return;
            }

            classList.splice(index, 1);
            this.openmct.objects.mutate(domainObject, 'classList', classList);
        },
        searchItem(input) {
            this.search = input;
        },
        toggleNav() {
            this.showNav = !this.showNav;
        },
        async updateDefaultNotebook(notebookStorage) {
            const defaultNotebookObject = await this.getDefaultNotebookObject();
            this.removeDefaultClass(defaultNotebookObject);
            setDefaultNotebook(this.openmct, notebookStorage);
            this.addDefaultClass();
            this.defaultSectionId = notebookStorage.section.id;
            this.defaultPageId = notebookStorage.page.id;
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
                this.defaultPageId = null
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
                this.defaultPageId = null
                this.removeDefaultClass(this.internalDomainObject);
                clearDefaultNotebook();

                return;
            }

            if (id !== defaultNotebookSection.id) {
                return;
            }

            setDefaultNotebookSection(section);
        },
        updateEntries(entries) {
            const configuration = this.internalDomainObject.configuration;
            const notebookEntries = configuration.entries || {};
            notebookEntries[this.selectedSection.id][this.selectedPage.id] = entries;

            this.mutateObject('configuration.entries', notebookEntries);
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        },
        updatePage({ pages = [], id = null}) {
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

            this.updateSection({ sections });
            this.updateDefaultNotebookPage(pages, id);
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
        updateSection({ sections, id = null }) {
            this.mutateObject('configuration.sections', sections);

            this.updateParams(sections);
            this.updateDefaultNotebookSection(sections, id);
        }
    }
}
</script>
