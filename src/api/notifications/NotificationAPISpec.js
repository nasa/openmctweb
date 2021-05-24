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

import NotificationAPI from './NotificationAPI';

const DEFAULT_TIMEOUT = 4000;

describe('The Notifiation API', () => {
    let notificationAPIInstance;

    beforeAll(() => {
        notificationAPIInstance = new NotificationAPI();
        jasmine.clock().install();
    });

    afterAll(() => {
        jasmine.clock().uninstall();
    });

    describe('the info method', () => {
        const message = 'Example Notification Message';
        const severity = 'info';
        let notificationModel;

        beforeAll(() => {
            notificationModel = notificationAPIInstance.info(message).model;
        });

        afterAll(() => {
            notificationAPIInstance.dismissAllNotifications();
        });

        it('shows a string message with info severity', () => {
            expect(notificationModel.message).toEqual(message);
            expect(notificationModel.severity).toEqual(severity);
        });

        it('auto dismisses the notification after a brief timeout', () => {
            jasmine.clock().tick(DEFAULT_TIMEOUT);

            expect(notificationAPIInstance.notifications.length).toEqual(0);
        });
    });

    describe('the alert method', () => {
        const message = 'Example alert message';
        const severity = 'alert';
        let notificationModel;

        beforeAll(() => {
            notificationModel = notificationAPIInstance.alert(message).model;
        });

        afterAll(() => {
            notificationAPIInstance.dismissAllNotifications();
        });

        it('shows a string message, with alert severity', () => {
            expect(notificationModel.message).toEqual(message);
            expect(notificationModel.severity).toEqual(severity);
        });

        it('does not auto dismiss the notification', () => {
            jasmine.clock().tick(DEFAULT_TIMEOUT);

            expect(notificationAPIInstance.notifications.length).toEqual(1);
        });
    });

    describe('the error method', () => {
        const message = 'Example error message';
        const severity = 'error';
        let notificationModel;

        beforeAll(() => {
            notificationModel = notificationAPIInstance.error(message).model;
        });

        afterAll(() => {
            notificationAPIInstance.dismissAllNotifications();
        });

        it('shows a string message, with severity error', () => {
            expect(notificationModel.message).toEqual(message);
            expect(notificationModel.severity).toEqual(severity);
        });

        it('does not auto dismiss the notification', () => {
            jasmine.clock().tick(DEFAULT_TIMEOUT);

            expect(notificationAPIInstance.notifications.length).toEqual(1);
        });
    });

    describe('the progress method', () => {
        const title = 'This is a progress notification';
        const message1 = 'Example progress message 1';
        const message2 = 'Example progress message 2';
        const percentage1 = 50;
        const percentage2 = 99.9;
        const severity = 'info';
        let notification;
        let updatedPercentage;
        let updatedMessage;

        beforeAll(() => {
            notification = notificationAPIInstance.progress(title, percentage1, message1);
            notification.on('progress', (percentage, text) => {
                updatedPercentage = percentage;
                updatedMessage = text;
            });
        });

        afterAll(() => {
            notificationAPIInstance.dismissAllNotifications();
        });

        it ('shows a notification with a message, progress message, percentage and info severity', () => {
            expect(notification.model.message).toEqual(title);
            expect(notification.model.severity).toEqual(severity);
            expect(notification.model.progressText).toEqual(message1);
            expect(notification.model.progressPerc).toEqual(percentage1);
        });

        it ('allows dynamically updating the progress attributes', () => {
            notification.progress(percentage2, message2);

            expect(updatedPercentage).toEqual(percentage2);
            expect(updatedMessage).toEqual(message2);
        });

        it ('allows dynamically dismissing of progress notification', () => {
            notification.dismiss();

            expect(notificationAPIInstance.notifications.length).toEqual(0);
        });
    });
});
