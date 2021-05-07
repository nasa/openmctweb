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

define([
    'EventEmitter',
    './Model',
    '../lib/extend',
    '../lib/eventHelpers'
], function (
    EventEmitter,
    Model,
    extend,
    eventHelpers
) {

    function Collection(options) {
        if (options.models) {
            this.models = options.models.map(this.modelFn, this);
        } else {
            this.models = [];
        }

        this.initialize(options);
    }

    Object.assign(Collection.prototype, EventEmitter.prototype);
    eventHelpers.extend(Collection.prototype);

    Collection.extend = extend;

    Collection.prototype.initialize = function (options) {

    };

    Collection.prototype.modelClass = Model;

    Collection.prototype.modelFn = function (model) {
        if (model instanceof this.modelClass) {
            model.collection = this;

            return model;

        }

        return new this.modelClass({
            collection: this,
            model: model
        });
    };

    Collection.prototype.first = function () {
        return this.at(0);
    };

    Collection.prototype.forEach = function (iteree, context) {
        this.models.forEach(iteree, context);
    };

    Collection.prototype.map = function (iteree, context) {
        return this.models.map(iteree, context);
    };

    Collection.prototype.filter = function (iteree, context) {
        return this.models.filter(iteree, context);
    };

    Collection.prototype.size = function () {
        return this.models.length;
    };

    Collection.prototype.at = function (index) {
        return this.models[index];
    };

    Collection.prototype.add = function (model) {
        model = this.modelFn(model);
        const index = this.models.length;
        this.models.push(model);
        this.emit('add', model, index);
    };

    Collection.prototype.insert = function (model, index) {
        model = this.modelFn(model);
        this.models.splice(index, 0, model);
        this.emit('add', model, index + 1);
    };

    Collection.prototype.indexOf = function (model) {
        return this.models.findIndex(m => m === model);
    };

    Collection.prototype.remove = function (model) {
        const index = this.indexOf(model);

        if (index === -1) {
            throw new Error('model not found in collection.');
        }

        this.emit('remove', model, index);
        this.models.splice(index, 1);
    };

    Collection.prototype.destroy = function (model) {
        this.forEach(function (m) {
            m.destroy();
        });
        this.stopListening();
    };

    return Collection;
});
