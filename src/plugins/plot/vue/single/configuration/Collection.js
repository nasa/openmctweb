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
import Model from './Model';

export default class Collection extends Model {

    initialize(options) {
        super.initialize(options);
        this.modelClass = Model;
        if (options.models) {
            this.models = options.models.map(this.modelFn, this);
        } else {
            this.models = [];
        }
    }

    modelFn(model) {
        //TODO: Come back to this - why are we doing this?
        if (model instanceof this.modelClass) {
            model.collection = this;

            return model;

        }

        return new this.modelClass({
            collection: this,
            model: model
        });
    }

    first() {
        return this.at(0);
    }

    forEach(iteree, context) {
        this.models.forEach(iteree, context);
    }

    map(iteree, context) {
        return this.models.map(iteree, context);
    }

    filter(iteree, context) {
        return this.models.filter(iteree, context);
    }

    size() {
        return this.models.length;
    }

    at(index) {
        return this.models[index];
    }

    add(model) {
        model = this.modelFn(model);
        const index = this.models.length;
        this.models.push(model);
        this.emit('add', model, index);
    }

    insert(model, index) {
        model = this.modelFn(model);
        this.models.splice(index, 0, model);
        this.emit('add', model, index + 1);
    }

    indexOf(model) {
        return this.models.findIndex(m => m === model);
    }

    remove(model) {
        const index = this.indexOf(model);

        if (index === -1) {
            throw new Error('model not found in collection.');
        }

        this.emit('remove', model, index);
        this.models.splice(index, 1);
    }

    destroy(model) {
        this.forEach(function (m) {
            m.destroy();
        });
        this.stopListening();
    }
}
