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

class IndependentTimeAPI extends EventEmitter {
    constructor() {
        super();
        this.offsets = {};

        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.observe = this.observe.bind(this);
    }

    get(keyString) {
        return this.offsets[keyString];
    }

    set(keyString, value, clock) {
        this.offsets[keyString] = value;
        // this.emit(keyString, value);
        if (!clock) {
            this.bounds(keyString);
        }
    }

    delete(keyString) {
        this.offsets[keyString] = undefined;
        // this.emit(keyString, undefined);
        delete this.offsets[keyString];
    }

    tick(timestamp) {
        Object.keys(this.offsets).forEach(keyString => {
            const clockOffsets = this.offsets[keyString];
            if (clockOffsets) {
                let bounds = {
                    start: timestamp + clockOffsets.start,
                    end: timestamp + clockOffsets.end
                };
                this.emit(keyString, 'bounds', bounds, true);
            }
        });
    }

    bounds(keyString) {
        const fixedOffsets = this.offsets[keyString];
        if (fixedOffsets) {
            this.emit(keyString, 'bounds', fixedOffsets, false);
        }
    }

    observe(key, callback) {
        this.on(key, callback);

        return () => {
            this.off(key, callback);
        };
    }
}

export default IndependentTimeAPI;
