<template>
<li
    draggable="true"
    @dragstart="emitDragStartEvent"
    @dragenter="onDragenter"
    @dragover="onDragover"
    @dragleave="onDragleave"
    @drop="emitDropEvent"
>
    <div
        class="c-tree__item c-elements-pool__item"
        :class="{
            'is-context-clicked': contextClickActive,
            'hover': hover
        }"
    >
        <span
            class="c-elements-pool__grippy c-grippy c-grippy--vertical-drag"
        ></span>
        <object-label
            :domain-object="elementObject"
            :object-path="[elementObject, parentObject]"
            @context-click-active="setContextClickState"
        />
    </div>
</li>
</template>

<script>
import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    components: {
        ObjectLabel
    },
    props: {
        index: {
            type: Number,
            required: true,
            default: () => {
                return 0;
            }
        },
        elementObject: {
            type: Object,
            required: true,
            default: () => {
                return {};
            }
        },
        parentObject: {
            type: Object,
            required: true,
            default: () => {
                return {};
            }
        },
        allowDrop: {
            type: Boolean
        }
    },
    data() {
        return {
            contextClickActive: false,
            hover: false
        };
    },
    methods: {
        onDragover(event) {
            event.preventDefault();
        },
        emitDropEvent(event) {
            this.$emit('drop-custom', this.index);
            this.hover = false;
        },
        emitDragStartEvent(event) {
            this.$emit('dragstart-custom', this.index);
        },
        onDragenter(event) {
            if (this.allowDrop) {
                this.hover = true;
                this.dragElement = event.target.parentElement;
            }
        },
        onDragleave(event) {
            if (event.target.parentElement === this.dragElement) {
                this.hover = false;
                delete this.dragElement;
            }
        },
        setContextClickState(state) {
            this.contextClickActive = state;
        }
    }
};
</script>
