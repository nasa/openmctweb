<template>
<div ref="createButton"
     class="c-create-button--w"
>
    <button
        class="c-create-button c-button--menu c-button--major icon-plus"
        @click.prevent.stop="showCreateMenu"
    >
        <span class="c-button__label">Create</span>
    </button>
</div>
</template>

<script>
import CreateAction from '../../../platform/commonUI/edit/src/creation/CreateAction';
import objectUtils from 'objectUtils';

export default {
    inject: ['openmct'],
    data: function () {
        let items = [];

        this.openmct.types.listKeys().forEach(key => {
            let menuItem = this.openmct.types.get(key).definition;

            if (menuItem.creatable) {
                let menuItemTemplate = {
                    cssClass: menuItem.cssClass,
                    name: menuItem.name,
                    description: menuItem.description,
                    callBack: () => this.create(key)
                };

                items.push(menuItemTemplate);
            }
        });

        return {
            items: items,
            selectedMenuItem: {},
            opened: false
        };
    },
    computed: {
        sortedItems() {
            return this.items.slice().sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                } else if (a.name > b.name) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }
    },
    methods: {
        showCreateMenu() {
            const elementBoundingClientRect = this.$refs.createButton.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

            const menuOptions = {
                menuClass: 'c-create-menu'
            };

            this.openmct.menus.showSuperMenu(x, y, this.sortedItems, menuOptions);
        },
        create(key) {
            // Hack for support.  TODO: rewrite create action.
            // 1. Get contextual object from navigation
            // 2. Get legacy type from legacy api
            // 3. Instantiate create action with type, parent, context
            // 4. perform action.
            return this.openmct.objects.get(this.openmct.router.path[0].identifier)
                .then((currentObject) => {
                    let legacyContextualParent = this.convertToLegacy(currentObject);
                    let legacyType = this.openmct.$injector.get('typeService').getType(key);
                    let context = {
                        key: "create",
                        domainObject: legacyContextualParent // should be same as parent object.
                    };
                    let action = new CreateAction(
                        legacyType,
                        legacyContextualParent,
                        context,
                        this.openmct
                    );

                    return action.perform();
                });
        },
        convertToLegacy(domainObject) {
            let keyString = objectUtils.makeKeyString(domainObject.identifier);
            let oldModel = objectUtils.toOldFormat(domainObject);

            return this.openmct.$injector.get('instantiate')(oldModel, keyString);
        }
    }
};
</script>
