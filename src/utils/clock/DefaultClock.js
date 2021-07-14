/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import EventEmitter from 'EventEmitter';

/**
 * A {@link openmct.TimeAPI.Clock} that updates the temporal bounds of the
 * application based on values provided by a ticking clock,
 * with the periodicity specified (optionally).
 * @param {number} period The periodicity with which the clock should tick
 * @constructor
 */

export default class DefaultClock extends EventEmitter {
    constructor() {
        super();

        this.key = 'clock';

        this.cssClass = 'icon-clock';
        this.name = 'Clock';
        this.description = "A default clock for openmct.";
    }

    tick(tickValue) {
        this.emit("tick", tickValue);
        this.lastTick = tickValue;
    }

    /**
     * Register a listener for the clock. When it ticks, the
     * clock will provide the time from the configured endpoint
     *
     * @param listener
     * @returns {function} a function for deregistering the provided listener
     */
    on(event) {
        let result = super.on.apply(this, arguments);

        if (this.listeners(event).length === 1) {
            this.start();
        }

        return result;
    }

    /**
     * Register a listener for the clock. When it ticks, the
     * clock will provide the current local system time
     *
     * @param listener
     * @returns {function} a function for deregistering the provided listener
     */
    off(event) {
        let result = super.off.apply(this, arguments);

        if (this.listeners(event).length === 0) {
            this.stop();
        }

        return result;
    }

    /**
     * @returns {number} The last value provided for a clock tick
     */
    currentValue() {
        return this.lastTick;
    }

}
