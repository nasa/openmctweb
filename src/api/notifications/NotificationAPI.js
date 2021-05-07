/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * This bundle implements the notification service, which can be used to
 * show banner notifications to the user. Banner notifications
 * are used to inform users of events in a non-intrusive way. As
 * much as possible, notifications share a model with blocking
 * dialogs so that the same information can be provided in a dialog
 * and then minimized to a banner notification if needed.
 *
 * @namespace platform/api/notifications
 */
import moment from 'moment';
import EventEmitter from 'EventEmitter';

/**
 * A representation of a banner notification. Banner notifications
 * are used to inform users of events in a non-intrusive way. As
 * much as possible, notifications share a model with blocking
 * dialogs so that the same information can be provided in a dialog
 * and then minimized to a banner notification if needed, or vice-versa.
 *
 * @typedef {object} NotificationModel
 * @property {string} message The message to be displayed by the notification
 * @property {number | 'unknown'} [progress] The progres of some ongoing task. Should be a number between 0 and 100, or
 * with the string literal 'unknown'.
 * @property {string} [progressText] A message conveying progress of some ongoing task.

 * @see DialogModel
 */

const DEFAULT_AUTO_DISMISS_TIMEOUT = 3000;
const MINIMIZE_ANIMATION_TIMEOUT = 300;

/**
 * The notification service is responsible for informing the user of
 * events via the use of banner notifications.
 * @memberof ui/notification
 * @constructor */

export default class NotificationAPI extends EventEmitter {
    constructor() {
        super();
        this.notifications = [];
        this.highest = { severity: "info" };

        /*
        * A context in which to hold the active notification and a
        * handle to its timeout.
        */
        this.activeNotification = undefined;
    }

    /**
     * Info notifications are low priority informational messages for the user. They will be auto-destroy after a brief
     * period of time.
     * @param {string} message The message to display to the user
     * @param {Object} [options] object with following properties
     *      autoDismissTimeout: {number} in miliseconds to automatically dismisses notification
     *      link: {Object} Add a link to notifications for navigation
     *              onClick: callback function
     *              cssClass: css class name to add style on link
     *              text: text to display for link
     * @returns {InfoNotification}
     */
    info(message, options = {}) {
        let notificationModel = {
            message: message,
            autoDismiss: true,
            severity: "info",
            options
        };

        return this._notify(notificationModel);
    }

    /**
     * Present an alert to the user.
     * @param {string} message The message to display to the user.
     * @param {Object} [options] object with following properties
     *      autoDismissTimeout: {number} in miliseconds to automatically dismisses notification
     *      link: {Object} Add a link to notifications for navigation
     *              onClick: callback function
     *              cssClass: css class name to add style on link
     *              text: text to display for link
     * @returns {Notification}
     */
    alert(message, options = {}) {
        let notificationModel = {
            message: message,
            severity: "alert",
            options
        };

        return this._notify(notificationModel);
    }

    /**
     * Present an error message to the user
     * @param {string} message
     * @param {Object} [options] object with following properties
     *      autoDismissTimeout: {number} in miliseconds to automatically dismisses notification
     *      link: {Object} Add a link to notifications for navigation
     *              onClick: callback function
     *              cssClass: css class name to add style on link
     *              text: text to display for link
     * @returns {Notification}
     */
    error(message, options = {}) {
        let notificationModel = {
            message: message,
            severity: "error",
            options
        };

        return this._notify(notificationModel);
    }

    /**
     * Create a new progress notification. These notifications will contain a progress bar.
     * @param {string} message
     * @param {number | 'unknown'} progressPerc A value between 0 and 100, or the string 'unknown'.
     * @param {string} [progressText] Text description of progress (eg. "10 of 20 objects copied").
     */
    progress(message, progressPerc, progressText) {
        let notificationModel = {
            message: message,
            progressPerc: progressPerc,
            progressText: progressText,
            severity: "info"
        };

        return this._notify(notificationModel);
    }

    dismissAllNotifications() {
        this.notifications = [];
        this.emit('dismiss-all');
    }

    /**
     * Minimize a notification. The notification will still be available
     * from the notification list. Typically notifications with a
     * severity of 'info' should not be minimized, but rather
     * dismissed.
     *
     * @private
     */
    _minimize(notification) {
        //Check this is a known notification
        let index = this.notifications.indexOf(notification);

        if (this.activeTimeout) {
            /*
                Method can be called manually (clicking dismiss) or
                automatically from an auto-timeout. this.activeTimeout
                acts as a semaphore to prevent race conditions. Cancel any
                timeout in progress (for the case where a manual dismiss
                has shortcut an active auto-dismiss), and clear the
                semaphore.
                */
            clearTimeout(this.activeTimeout);
            delete this.activeTimeout;
        }

        if (index >= 0) {
            notification.model.minimized = true;
            notification.emit('minimized');
            //Add a brief timeout before showing the next notification
            // in order to allow the minimize animation to run through.
            setTimeout(() => {
                notification.emit('destroy');
                this._setActiveNotification(this._selectNextNotification());
            }, MINIMIZE_ANIMATION_TIMEOUT);
        }
    }

    /**
     * Completely removes a notification. This will dismiss it from the
     * message banner and remove it from the list of notifications.
     * Typically only notifications with a severity of info should be
     * dismissed. If you're not sure whether to dismiss or minimize a
     * notification, use {@link Notification#dismissOrMinimize}.
     * dismiss
     *
     * @private
     */
    _dismiss(notification) {
        //Check this is a known notification
        let index = this.notifications.indexOf(notification);

        if (this.activeTimeout) {
            /* Method can be called manually (clicking dismiss) or
                * automatically from an auto-timeout. this.activeTimeout
                * acts as a semaphore to prevent race conditions. Cancel any
                * timeout in progress (for the case where a manual dismiss
                * has shortcut an active auto-dismiss), and clear the
                * semaphore.
                */

            clearTimeout(this.activeTimeout);
            delete this.activeTimeout;
        }

        if (index >= 0) {
            this.notifications.splice(index, 1);
        }

        this._setActiveNotification(this._selectNextNotification());
        this._setHighestSeverity();
        notification.emit('destroy');
    }

    /**
     * Depending on the severity of the notification will selectively
     * dismiss or minimize where appropriate.
     *
     * @private
     */
    _dismissOrMinimize(notification) {
        let model = notification.model;
        if (model.severity === "info") {
            this._dismiss(notification);
        } else {
            this._minimize(notification);
        }
    }

    /**
     * @private
     */
    _setHighestSeverity() {
        let severity = {
            "info": 1,
            "alert": 2,
            "error": 3
        };
        this.highest.severity = this.notifications.reduce((previous, notification) => {
            if (severity[notification.model.severity] > severity[previous]) {
                return notification.model.severity;
            } else {
                return previous;
            }
        }, "info");
    }

    /**
     * Notifies the user of an event. If there is a banner notification
     * already active, then it will be dismissed or minimized automatically,
     * and the provided notification displayed in its place.
     *
     * @param {NotificationModel} notificationModel The notification to
     * display
     * @returns {Notification} the provided notification decorated with
     * functions to {@link Notification#dismiss} or {@link Notification#minimize}
     */
    _notify(notificationModel) {
        let notification;
        let activeNotification = this.activeNotification;

        notificationModel.severity = notificationModel.severity || "info";
        notificationModel.timestamp = moment.utc().format('YYYY-MM-DD hh:mm:ss.ms');

        notification = this._createNotification(notificationModel);

        this.notifications.push(notification);
        this._setHighestSeverity();

        /*
        Check if there is already an active (ie. visible) notification
            */
        if (!this.activeNotification) {
            this._setActiveNotification(notification);
        } else if (!this.activeTimeout) {
            /*
                If there is already an active notification, time it out. If it's
                already got a timeout in progress (either because it has had
                timeout forced because of a queue of messages, or it had an
                autodismiss specified), leave it to run. Otherwise force a
                timeout.

                This notification has been added to queue and will be
                serviced as soon as possible.
                */
            this.activeTimeout = setTimeout(() => {
                this._dismissOrMinimize(activeNotification);
            }, DEFAULT_AUTO_DISMISS_TIMEOUT);
        }

        return notification;
    }

    /**
     * @private
     */
    _createNotification(notificationModel) {
        let notification = new EventEmitter();
        notification.model = notificationModel;
        notification.dismiss = () => {
            this._dismiss(notification);
        };

        if (Object.prototype.hasOwnProperty.call(notificationModel, 'progressPerc')) {
            notification.progress = (progressPerc, progressText) => {
                notification.model.progressPerc = progressPerc;
                notification.model.progressText = progressText;
                notification.emit('progress', progressPerc, progressText);
            };
        }

        return notification;
    }

    /**
     * @private
     */
    _setActiveNotification(notification) {
        this.activeNotification = notification;

        if (!notification) {
            delete this.activeTimeout;

            return;
        }

        this.emit('notification', notification);

        if (notification.model.autoDismiss || this._selectNextNotification()) {
            const autoDismissTimeout = notification.model.options.autoDismissTimeout
                || DEFAULT_AUTO_DISMISS_TIMEOUT;
            this.activeTimeout = setTimeout(() => {
                this._dismissOrMinimize(notification);
            }, autoDismissTimeout);
        } else {
            delete this.activeTimeout;
        }
    }

    /**
     * Used internally by the NotificationService
     *
     * @private
     */
    _selectNextNotification() {
        let notification;
        let i = 0;

        /*
        Loop through the notifications queue and find the first one that
        has not already been minimized (manually or otherwise).
            */
        for (; i < this.notifications.length; i++) {
            notification = this.notifications[i];

            if (!notification.model.minimized
                && notification !== this.activeNotification) {
                return notification;
            }
        }
    }
}
