export default {
    inject: ['openmct'],
    props: {
        'objectPath': {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            contextClickActive: false
        };
    },
    mounted() {
        //TODO: touch support
        this.$el.addEventListener('contextmenu', this.showContextMenu);

        function updateObject(oldObject, newObject) {
            Object.assign(oldObject, newObject);
        }

        this.objectPath.forEach(object => {
            if (object) {
                this.$once('hook:destroyed',
                    this.openmct.objects.observe(object, '*', updateObject.bind(this, object)));
            }
        });
    },
    destroyed() {
        this.$el.removeEventListener('contextMenu', this.showContextMenu);
    },
    methods: {
        showContextMenu(event) {
            event.preventDefault();
            event.stopPropagation();

            let actionsCollection = this.openmct.actions.get(this.objectPath);
            let actions = actionsCollection.getVisibleActions();
            let sortedActions = this.openmct.actions._groupAndSortActions(actions);

            const menuOptions = {
                onDestroy: this.onContextMenuDestroyed
            };

            this.openmct.menus.showMenu(event.clientX, event.clientY, sortedActions, menuOptions);
            this.contextClickActive = true;
            this.$emit('context-click-active', true);
        },
        onContextMenuDestroyed() {
            this.contextClickActive = false;
            this.$emit('context-click-active', false);
        }
    }
};
