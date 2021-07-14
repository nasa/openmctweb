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

import { createOpenMct, resetApplicationState } from "utils/testing";
import ConductorPlugin from "./plugin";

const THIRTY_SECONDS = 30 * 1000;
const ONE_MINUTE = THIRTY_SECONDS * 2;
const FIVE_MINUTES = ONE_MINUTE * 5;
const FIFTEEN_MINUTES = FIVE_MINUTES * 3;
const THIRTY_MINUTES = FIFTEEN_MINUTES * 2;

describe('time conductor', () => {
    let element;
    let child;
    let openmct;
    let config = {
        menuOptions: [
            {
                name: "FixedTimeRange",
                timeSystem: 'utc',
                bounds: {
                    start: Date.now() - THIRTY_MINUTES,
                    end: Date.now()
                },
                presets: [],
                records: 2
            },
            {
                name: "LocalClock",
                timeSystem: 'utc',
                clock: 'local',
                clockOffsets: {
                    start: -THIRTY_MINUTES,
                    end: THIRTY_SECONDS
                },
                presets: []
            }
        ]
    };

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(new ConductorPlugin(config));

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe('it shows delta inputs', () => {
        it('in fixed mode', () => {

        });

        it('in realtime mode', () => {

        });
    });
});
