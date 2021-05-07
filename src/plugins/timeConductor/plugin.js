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

import Conductor from './Conductor.vue';

function isTruthy(a) {
    return Boolean(a);
}

function validateMenuOption(menuOption, index) {
    if (menuOption.clock && !menuOption.clockOffsets) {
        return `Conductor menu option is missing required property 'clockOffsets'. This field is required when configuring a menu option with a clock.\r\n${JSON.stringify(menuOption)}`;
    }

    if (!menuOption.timeSystem) {
        return `Conductor menu option is missing required property 'timeSystem'\r\n${JSON.stringify(menuOption)}`;
    }

    if (!menuOption.bounds && !menuOption.clock) {
        return `Conductor menu option is missing required property 'bounds'. This field is required when configuring a menu option with fixed bounds.\r\n${JSON.stringify(menuOption)}`;
    }
}

function hasRequiredOptions(config) {
    if (config === undefined
        || config.menuOptions === undefined
        || config.menuOptions.length === 0) {
        return "You must specify one or more 'menuOptions'.";
    }

    if (config.menuOptions.some(validateMenuOption)) {
        return config.menuOptions.map(validateMenuOption)
            .filter(isTruthy)
            .join('\n');
    }

    return undefined;
}

function validateConfiguration(config, openmct) {
    const systems = openmct.time.getAllTimeSystems()
        .reduce(function (m, ts) {
            m[ts.key] = ts;

            return m;
        }, {});
    const clocks = openmct.time.getAllClocks()
        .reduce(function (m, c) {
            m[c.key] = c;

            return m;
        }, {});

    return config.menuOptions.map(function (menuOption) {
        let message = '';
        if (menuOption.timeSystem && !systems[menuOption.timeSystem]) {
            message = `Time system '${menuOption.timeSystem}' has not been registered: \r\n ${JSON.stringify(menuOption)}`;
        }

        if (menuOption.clock && !clocks[menuOption.clock]) {
            message = `Clock '${menuOption.clock}' has not been registered: \r\n ${JSON.stringify(menuOption)}`;
        }

        return message;
    }).filter(isTruthy).join('\n');
}

function throwIfError(configResult) {
    if (configResult) {
        throw new Error(`Invalid Time Conductor Configuration. ${configResult} \r\n https://github.com/nasa/openmct/blob/master/API.md#the-time-conductor`);
    }
}

function mountComponent(openmct, configuration) {
    openmct.layout.conductorComponent = Object.create({
        components: {
            Conductor
        },
        template: "<conductor></conductor>",
        provide: {
            openmct: openmct,
            configuration: configuration
        }
    });
}

export default function (config) {
    return function (openmct) {
        let configResult = hasRequiredOptions(config) || validateConfiguration(config, openmct);
        throwIfError(configResult);

        const defaults = config.menuOptions[0];
        if (defaults.clock) {
            openmct.time.clock(defaults.clock, defaults.clockOffsets);
            openmct.time.timeSystem(defaults.timeSystem, openmct.time.bounds());
        } else {
            openmct.time.timeSystem(defaults.timeSystem, defaults.bounds);
        }

        openmct.on('start', function () {
            mountComponent(openmct, config);
        });
    };
}
