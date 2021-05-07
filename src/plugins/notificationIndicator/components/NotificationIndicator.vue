<template>
<div
    v-if="notifications.length > 0"
    class="c-indicator c-indicator--clickable icon-bell"
    :class="[severityClass]"
>
    <span class="c-indicator__label">
        <button @click="toggleNotificationsList(true)">
            {{ notificationsCountMessage(notifications.length) }}
        </button>
        <button @click="dismissAllNotifications()">
            Clear All
        </button>
    </span>
    <span class="c-indicator__count">{{ notifications.length }}</span>

    <notifications-list
        v-if="showNotificationsOverlay"
        :notifications="notifications"
        @close="toggleNotificationsList"
        @clear-all="dismissAllNotifications"
    />
</div>
</template>

<script>
import NotificationsList from './NotificationsList.vue';

export default {
    components: {
        NotificationsList
    },
    inject: ['openmct'],
    data() {
        return {
            notifications: this.openmct.notifications.notifications,
            highest: this.openmct.notifications.highest,
            showNotificationsOverlay: false
        };
    },
    computed: {
        severityClass() {
            return `s-status-${this.highest.severity}`;
        }
    },
    mounted() {
        this.openmct.notifications.on('notification', this.updateNotifications);
        this.openmct.notifications.on('dismiss-all', this.updateNotifications);
    },
    methods: {
        dismissAllNotifications() {
            this.openmct.notifications.dismissAllNotifications();
        },
        toggleNotificationsList(flag) {
            this.showNotificationsOverlay = flag;
        },
        updateNotifications() {
            this.notifications = this.openmct.notifications.notifications;
            this.highest = this.openmct.notifications.highest;
        },
        notificationsCountMessage(count) {
            if (count > 1) {
                return `${count} Notifications`;
            } else {
                return `${count} Notification`;
            }
        }
    }
};
</script>
