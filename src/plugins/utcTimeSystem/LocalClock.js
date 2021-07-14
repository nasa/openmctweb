/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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

import DefaultClock from "../../utils/clock/DefaultClock";
/**
 * A {@link openmct.TimeAPI.Clock} that updates the temporal bounds of the
 * application based on UTC time values provided by a ticking local clock,
 * with the periodicity specified.
 * @param {number} period The periodicity with which the clock should tick
 * @constructor
 */

export default class LocalClock extends DefaultClock {
    constructor(period = 100) {
        super();

        this.key = 'local';
        this.name = 'Local Clock';
        this.description = "Provides UTC timestamps every second from the local system clock.";

        this.period = period;
        this.timeoutHandle = undefined;
        this.lastTick = Date.now();
    }

    start() {
        this.timeoutHandle = setTimeout(this.tick.bind(this), this.period);
    }

    stop() {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = undefined;
        }
    }

    tick() {
        const now = Date.now();
        super.tick(now);
        this.timeoutHandle = setTimeout(this.tick.bind(this), this.period);
    }

}
