<template>
<ul class="c-list">
    <li v-for="section in sections"
        :key="section.id"
        class="c-list__item-h"
    >
        <sectionComponent ref="sectionComponent"
                          :default-section-id="defaultSectionId"
                          :section="section"
                          :section-title="sectionTitle"
                          @deleteSection="deleteSection"
                          @renameSection="updateSection"
                          @selectSection="selectSection"
        />
    </li>
</ul>
</template>

<script>
import { deleteNotebookEntries } from '../utils/notebook-entries';
import { getDefaultNotebook } from '../utils/notebook-storage';
import sectionComponent from './SectionComponent.vue';

export default {
    components: {
        sectionComponent
    },
    inject: ['openmct'],
    props: {
        defaultSectionId: {
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
        sections: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        },
        sectionTitle: {
            type: String,
            default() {
                return '';
            }
        }
    },
    methods: {
        deleteSection(id) {
            const section = this.sections.find(s => s.id === id);
            deleteNotebookEntries(this.openmct, this.domainObject, section);

            const selectedSection = this.sections.find(s => s.isSelected);
            const defaultNotebook = getDefaultNotebook();
            const defaultSection = defaultNotebook && defaultNotebook.section;
            const isSectionSelected = selectedSection && selectedSection.id === id;
            const isSectionDefault = defaultSection && defaultSection.id === id;
            const sections = this.sections.filter(s => s.id !== id);

            if (isSectionSelected && defaultSection) {
                sections.forEach(s => {
                    s.isSelected = false;
                    if (defaultSection && defaultSection.id === s.id) {
                        s.isSelected = true;
                    }
                });
            }

            if (sections.length && isSectionSelected && (!defaultSection || isSectionDefault)) {
                sections[0].isSelected = true;
            }

            this.$emit('updateSection', {
                sections,
                id
            });
        },
        selectSection(id, newSections) {
            const currentSections = newSections || this.sections;
            const sections = currentSections.map(section => {
                const isSelected = section.id === id;
                section.isSelected = isSelected;

                return section;
            });
            this.$emit('updateSection', {
                sections,
                id
            });
        },
        updateSection(newSection) {
            const id = newSection.id;
            const sections = this.sections.map(section =>
                section.id === id
                    ? newSection
                    : section);
            this.$emit('updateSection', {
                sections,
                id
            });
        }
    }
};
</script>
