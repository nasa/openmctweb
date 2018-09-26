
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

import EventEmitter from 'EventEmitter';

export default class Editor extends EventEmitter {
    constructor(openmct) {
        super();
        this.editing = false;
        this.openmct = openmct;
    }

    edit() {
        this.editing = true;
        this.getTransactionService().startTransaction();
        this.emit('isEditing', true);
    }

    isEditing() {
        return this.editing;
    }

    save() {
        return this.getTransactionService().commit().then((result)=>{
            this.editing = false;
            this.emit('isEditing', false);
            return result
        }).catch((error)=>{
            throw error;
        });
    }
    cancel() {
        this.getTransactionService().cancel();
        this.editing = false;
        this.emit('isEditing', false);
    }

    /**
     * @private
     */
    getTransactionService() {
        if (!this.transactionService) {
            this.transactionService = this.openmct.$injector.get('transactionService');
        }
        return this.transactionService;
    }
}
