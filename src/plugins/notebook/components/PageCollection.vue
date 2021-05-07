<template>
<ul class="c-list">
    <li v-for="page in pages"
        :key="page.id"
        class="c-list__item-h"
    >
        <Page ref="pageComponent"
              :default-page-id="defaultPageId"
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
        domainObject: {
            type: Object,
            default() {
                return {};
            }
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
    methods: {
        deletePage(id) {
            const selectedSection = this.sections.find(s => s.isSelected);
            const page = this.pages.find(p => p.id === id);
            deleteNotebookEntries(this.openmct, this.domainObject, selectedSection, page);

            const selectedPage = this.pages.find(p => p.isSelected);
            const defaultNotebook = getDefaultNotebook();
            const defaultpage = defaultNotebook && defaultNotebook.page;
            const isPageSelected = selectedPage && selectedPage.id === id;
            const isPageDefault = defaultpage && defaultpage.id === id;
            const pages = this.pages.filter(s => s.id !== id);

            if (isPageSelected && defaultpage) {
                pages.forEach(s => {
                    s.isSelected = false;
                    if (defaultpage && defaultpage.id === s.id) {
                        s.isSelected = true;
                    }
                });
            }

            if (pages.length && isPageSelected && (!defaultpage || isPageDefault)) {
                pages[0].isSelected = true;
            }

            this.$emit('updatePage', {
                pages,
                id
            });
        },
        selectPage(id) {
            const pages = this.pages.map(page => {
                const isSelected = page.id === id;
                page.isSelected = isSelected;

                return page;
            });

            this.$emit('updatePage', {
                pages,
                id
            });

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
