<template>
<div class="c-list__item js-list__item"
     :class="[{ 'is-selected': section.isSelected, 'is-notebook-default' : (defaultSectionId === section.id) }]"
     :data-id="section.id"
     @click="selectSection"
>
    <span class="c-list__item__name js-list__item__name"
          :data-id="section.id"
          @keydown.enter="updateName"
          @blur="updateName"
    >{{ section.name.length ? section.name : `Unnamed ${sectionTitle}` }}</span>
    <PopupMenu :popup-menu-items="popupMenuItems" />
</div>
</template>

<style lang="scss">
</style>

<script>
import PopupMenu from './PopupMenu.vue';
import RemoveDialog from '../utils/removeDialog';

export default {
    components: {
        PopupMenu
    },
    inject: ['openmct'],
    props: {
        defaultSectionId: {
            type: String,
            default() {
                return '';
            }
        },
        section: {
            type: Object,
            required: true
        },
        sectionTitle: {
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
            popupMenuItems: [],
            removeActionString: `Delete ${this.sectionTitle}`
        };
    },
    watch: {
        section(newSection) {
            this.toggleContentEditable(newSection);
        }
    },
    mounted() {
        this.addPopupMenuItems();
        this.toggleContentEditable();
    },
    methods: {
        addPopupMenuItems() {
            const removeSection = {
                cssClass: 'icon-trash',
                name: this.removeActionString,
                callback: this.getRemoveDialog.bind(this)
            };

            this.popupMenuItems = [removeSection];
        },
        deleteSection(success) {
            if (!success) {
                return;
            }

            this.$emit('deleteSection', this.section.id);
        },
        getRemoveDialog() {
            const message = 'This action will delete this section and all of its pages and entries. Do you want to continue?';
            const options = {
                name: this.removeActionString,
                callback: this.deleteSection.bind(this),
                message
            };

            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
        },
        selectSection(event) {
            const target = event.target;
            const section = target.closest('.js-list__item');
            const input = section.querySelector('.js-list__item__name');

            if (section.className.indexOf('is-selected') > -1) {
                input.contentEditable = true;
                input.classList.add('c-input-inline');

                return;
            }

            const id = target.dataset.id;

            if (!id) {
                return;
            }

            this.$emit('selectSection', id);
        },
        toggleContentEditable(section = this.section) {
            const sectionTitle = this.$el.querySelector('span');
            sectionTitle.contentEditable = section.isSelected;
        },
        updateName(event) {
            const target = event.target;
            target.contentEditable = false;
            target.classList.remove('c-input-inline');
            const name = target.textContent.trim();

            if (this.section.name === name) {
                return;
            }

            if (name === '') {
                return;
            }

            this.$emit('renameSection', Object.assign(this.section, { name }));
        }
    }
};
</script>
