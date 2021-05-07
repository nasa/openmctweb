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

import EventEmitter from 'EventEmitter';
import eventHelpers from "../lib/eventHelpers";
import _ from 'lodash';

export default class Model extends EventEmitter {
    constructor(options) {
        super();

        //need to do this as we're already extending EventEmitter
        eventHelpers.extend(this);

        if (!options) {
            options = {};
        }

        this.id = options.id;
        this.model = options.model;
        this.collection = options.collection;
        const defaults = this.defaults(options);
        if (!this.model) {
            this.model = options.model = defaults;
        } else {
            _.defaultsDeep(this.model, defaults);
        }

        this.initialize(options);
        this.idAttr = 'id';
    }

    defaults(options) {
        return {};
    }

    initialize(model) {

    }

    /**
     * Destroy the model, removing all listeners and subscriptions.
     */
    destroy() {
        this.emit('destroy');
        this.removeAllListeners();
    }

    id() {
        return this.get(this.idAttr);
    }

    get(attribute) {
        return this.model[attribute];
    }

    has(attribute) {
        return _.has(this.model, attribute);
    }

    set(attribute, value) {
        const oldValue = this.model[attribute];
        this.model[attribute] = value;
        this.emit('change', attribute, value, oldValue, this);
        this.emit('change:' + attribute, value, oldValue, this);
    }

    unset(attribute) {
        const oldValue = this.model[attribute];
        delete this.model[attribute];
        this.emit('change', attribute, undefined, oldValue, this);
        this.emit('change:' + attribute, undefined, oldValue, this);
    }
}
