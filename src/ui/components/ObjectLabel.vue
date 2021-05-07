<template>
<a
    class="c-tree__item__label c-object-label"
    :class="[statusClass]"
    draggable="true"
    @dragstart="dragStart"
    @click="navigateOrPreview"
>
    <div
        class="c-tree__item__type-icon c-object-label__type-icon"
        :class="typeClass"
    >
        <span class="is-status__indicator"
              :title="`This item is ${status}`"
        ></span>
    </div>
    <div class="c-tree__item__name c-object-label__name">
        {{ domainObject.name }}
    </div>
</a>
</template>

<script>

import ObjectLink from '../mixins/object-link';
import ContextMenuGesture from '../mixins/context-menu-gesture';
import PreviewAction from '../preview/PreviewAction.js';

export default {
    mixins: [ObjectLink, ContextMenuGesture],
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        objectPath: {
            type: Array,
            required: true
        },
        navigateToPath: {
            type: String,
            default: undefined
        }
    },
    data() {
        return {
            status: ''
        };
    },
    computed: {
        typeClass() {
            let type = this.openmct.types.get(this.domainObject.type);
            if (!type) {
                return 'icon-object-unknown';
            }

            return type.definition.cssClass;
        },
        statusClass() {
            return (this.status) ? `is-status--${this.status}` : '';
        }
    },
    mounted() {
        this.removeStatusListener = this.openmct.status.observe(this.domainObject.identifier, this.setStatus);
        this.status = this.openmct.status.get(this.domainObject.identifier);
        this.previewAction = new PreviewAction(this.openmct);
    },
    destroyed() {
        this.removeStatusListener();
    },
    methods: {
        navigateOrPreview(event) {
            if (this.openmct.editor.isEditing()) {
                event.preventDefault();
                this.preview();
            } else {
                window.location.assign(this.objectLink);
            }
        },
        preview() {
            if (this.previewAction.appliesTo(this.objectPath)) {
                this.previewAction.invoke(this.objectPath);
            }
        },
        dragStart(event) {
            let navigatedObject = this.openmct.router.path[0];
            let serializedPath = JSON.stringify(this.objectPath);
            let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            /*
             * Cannot inspect data transfer objects on dragover/dragenter so impossible to determine composability at
             * that point. If dragged object can be composed by navigated object, then indicate with presence of
             * 'composable-domain-object' in data transfer
             */
            if (this.openmct.composition.checkPolicy(navigatedObject, this.domainObject)) {
                event.dataTransfer.setData("openmct/composable-domain-object", JSON.stringify(this.domainObject));
            }

            // serialize domain object anyway, because some views can drag-and-drop objects without composition
            // (eg. notabook.)
            event.dataTransfer.setData("openmct/domain-object-path", serializedPath);
            event.dataTransfer.setData(`openmct/domain-object/${keyString}`, this.domainObject);
        },
        setStatus(status) {
            this.status = status;
        }
    }
};
</script>
