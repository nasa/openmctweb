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
export default class NotificationService {
    constructor(openmct) {
        this.openmct = openmct;
    }
    info(message) {
        if (typeof message === 'string') {
            return this.openmct.notifications.info(message);
        } else {
            if (Object.prototype.hasOwnProperty.call(message, 'progress')) {
                return this.openmct.notifications.progress(message.title, message.progress, message.progressText);
            } else {
                return this.openmct.notifications.info(message.title);
            }
        }
    }
    alert(message) {
        if (typeof message === 'string') {
            return this.openmct.notifications.alert(message);
        } else {
            return this.openmct.notifications.alert(message.title);
        }
    }
    error(message) {
        if (typeof message === 'string') {
            return this.openmct.notifications.error(message);
        } else {
            return this.openmct.notifications.error(message.title);
        }
    }
    notify(options) {
        switch (options.severity) {
        case 'info':
            return this.info(options);
        case 'alert':
            return this.alert(options);
        case 'error':
            return this.error(options);
        }
    }
    getAllNotifications() {
        return this.openmct.notifications.notifications;
    }
}
