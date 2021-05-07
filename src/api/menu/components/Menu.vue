<template>
<div class="c-menu"
     :class="options.menuClass"
>
    <ul v-if="options.actions.length && options.actions[0].length">
        <template
            v-for="(actionGroups, index) in options.actions"
        >
            <li
                v-for="action in actionGroups"
                :key="action.name"
                :class="[action.cssClass, action.isDisabled ? 'disabled' : '']"
                :title="action.description"
                @click="action.callBack"
            >
                {{ action.name }}
            </li>
            <div
                v-if="index !== options.actions.length - 1"
                :key="index"
                class="c-menu__section-separator"
            >
            </div>
            <li
                v-if="actionGroups.length === 0"
                :key="index"
            >
                No actions defined.
            </li>
        </template>
    </ul>

    <ul v-else>
        <li
            v-for="action in options.actions"
            :key="action.name"
            :class="action.cssClass"
            :title="action.description"
            @click="action.callBack"
        >
            {{ action.name }}
        </li>
        <li v-if="options.actions.length === 0">
            No actions defined.
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['options']
};
</script>
