<template>
<ul class="c-list">
    <li v-for="page in pages"
        :key="page.id"
        class="c-list__item-h"
    >
        <Page ref="pageComponent"
              :default-page-id="defaultPageId"
              :selected-page-id="selectedPageId"
              :page="page"
              :page-title="pageTitle"
              @deletePage="deletePage"
              @renamePage="updatePage"
              @selectPage="selectPage"
        />
    </li>
</ul>
</template>

<script>
import { deleteNotebookEntries } from '../utils/notebook-entries';
import { getDefaultNotebook } from '../utils/notebook-storage';
import Page from './PageComponent.vue';

export default {
    components: {
        Page
    },
    inject: ['openmct'],
    props: {
        defaultPageId: {
            type: String,
            default() {
                return '';
            }
        },
        selectedPageId: {
            type: String,
            required: true
        },
        domainObject: {
            type: Object,
            required: true
        },
        pages: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        },
        sections: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        },
        pageTitle: {
            type: String,
            default() {
                return '';
            }
        },
        sidebarCoversEntries: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    watch: {
        pages() {
            if (!this.containsPage(this.selectedPageId)) {
                this.selectPage(this.pages[0].id);
            }
        }
    },
    methods: {
        containsPage(pageId) {
            return this.pages.some(page => page.id === pageId);
        },
        deletePage(id) {
            const selectedSection = this.sections.find(s => s.isSelected);
            const page = this.pages.find(p => p.id === id);
            deleteNotebookEntries(this.openmct, this.domainObject, selectedSection, page);

            const selectedPage = this.pages.find(p => p.isSelected);
            const defaultNotebook = getDefaultNotebook();
            const defaultPageId = defaultNotebook && defaultNotebook.defaultPageId;
            const isPageSelected = selectedPage && selectedPage.id === id;
            const isPageDefault = defaultPageId === id;
            const pages = this.pages.filter(s => s.id !== id);
            let selectedPageId;

            if (isPageSelected && defaultPageId) {
                pages.forEach(s => {
                    s.isSelected = false;
                    if (defaultPageId === s.id) {
                        selectedPageId = s.id;
                    }
                });
            }

            if (isPageDefault) {
                this.$emit('defaultPageDeleted');
            }

            if (pages.length && isPageSelected && (!defaultPageId || isPageDefault)) {
                selectedPageId = pages[0].id;
            }

            this.$emit('updatePage', {
                pages,
                id
            });
            this.$emit('selectPage', selectedPageId);
        },
        selectPage(id) {
            this.$emit('selectPage', id);

            // Add test here for whether or not to toggle the nav
            if (this.sidebarCoversEntries) {
                this.$emit('toggleNav');
            }
        },
        updatePage(newPage) {
            const id = newPage.id;
            const pages = this.pages.map(page =>
                page.id === id
                    ? newPage
                    : page);
            this.$emit('updatePage', {
                pages,
                id
            });
        }
    }
};
</script>
