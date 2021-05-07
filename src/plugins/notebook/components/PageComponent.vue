<template>
<div class="c-list__item js-list__item"
     :class="[{ 'is-selected': page.isSelected, 'is-notebook-default' : (defaultPageId === page.id) }]"
     :data-id="page.id"
     @click="selectPage"
>
    <span class="c-list__item__name js-list__item__name"
          :data-id="page.id"
          @keydown.enter="updateName"
          @blur="updateName"
    >{{ page.name.length ? page.name : `Unnamed ${pageTitle}` }}</span>
    <PopupMenu :popup-menu-items="popupMenuItems" />
</div>
</template>

<script>
import PopupMenu from './PopupMenu.vue';
import RemoveDialog from '../utils/removeDialog';

export default {
    components: {
        PopupMenu
    },
    inject: ['openmct'],
    props: {
        defaultPageId: {
            type: String,
            default() {
                return '';
            }
        },
        page: {
            type: Object,
            required: true
        },
        pageTitle: {
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
            popupMenuItems: [],
            removeActionString: `Delete ${this.pageTitle}`
        };
    },
    watch: {
        page(newPage) {
            this.toggleContentEditable(newPage);
        }
    },
    mounted() {
        this.addPopupMenuItems();
        this.toggleContentEditable();
    },
    methods: {
        addPopupMenuItems() {
            const removePage = {
                cssClass: 'icon-trash',
                name: this.removeActionString,
                callback: this.getRemoveDialog.bind(this)
            };

            this.popupMenuItems = [removePage];
        },
        deletePage(success) {
            if (!success) {
                return;
            }

            this.$emit('deletePage', this.page.id);
        },
        getRemoveDialog() {
            const message = 'This action will delete this page and all of its entries. Do you want to continue?';
            const options = {
                name: this.removeActionString,
                callback: this.deletePage.bind(this),
                message
            };
            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
        },
        selectPage(event) {
            const target = event.target;
            const page = target.closest('.js-list__item');
            const input = page.querySelector('.js-list__item__name');

            if (page.className.indexOf('is-selected') > -1) {
                input.contentEditable = true;
                input.classList.add('c-input-inline');

                return;
            }

            const id = target.dataset.id;
            if (!id) {
                return;
            }

            this.$emit('selectPage', id);
        },
        toggleContentEditable(page = this.page) {
            const pageTitle = this.$el.querySelector('span');
            pageTitle.contentEditable = page.isSelected;
        },
        updateName(event) {
            const target = event.target;
            const name = target.textContent.toString();
            target.contentEditable = false;
            target.classList.remove('c-input-inline');

            if (this.page.name === name) {
                return;
            }

            if (name === '') {
                return;
            }

            this.$emit('renamePage', Object.assign(this.page, { name }));
        }
    }
};
</script>
