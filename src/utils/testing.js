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

import MCT from 'MCT';
let nativeFunctions = [];
let mockObjects = setMockObjects();

export function createOpenMct() {
    const openmct = new MCT();
    openmct.install(openmct.plugins.LocalStorage());
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.time.timeSystem('utc', {
        start: 0,
        end: 1
    });

    return openmct;
}

export function createMouseEvent(eventName) {
    return new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        view: window
    });
}

export function spyOnBuiltins(functionNames, object = window) {
    functionNames.forEach(functionName => {
        if (nativeFunctions[functionName]) {
            throw `Builtin spy function already defined for ${functionName}`;
        }

        nativeFunctions.push({
            functionName,
            object,
            nativeFunction: object[functionName]
        });
        spyOn(object, functionName);
    });
}

export function clearBuiltinSpies() {
    nativeFunctions.forEach(clearBuiltinSpy);
    nativeFunctions = [];
}

export function resetApplicationState(openmct) {
    let promise;

    clearBuiltinSpies();

    if (openmct !== undefined) {
        openmct.destroy();
    }

    if (window.location.hash !== '#' && window.location.hash !== '') {
        promise = new Promise((resolve, reject) => {
            window.addEventListener('hashchange', cleanup);
            window.location.hash = '#';

            function cleanup() {
                window.removeEventListener('hashchange', cleanup);
                resolve();
            }
        });
    } else {
        promise = Promise.resolve();
    }

    return promise;
}

// required: key
// optional: element, keyCode, type
export function simulateKeyEvent(opts) {

    if (!opts.key) {
        console.warn('simulateKeyEvent needs a key');

        return;
    }

    const el = opts.element || document;
    const key = opts.key;
    const keyCode = opts.keyCode || key;
    const type = opts.type || 'keydown';
    const event = new Event(type);

    event.keyCode = keyCode;
    event.key = key;

    el.dispatchEvent(event);
}

function clearBuiltinSpy(funcDefinition) {
    funcDefinition.object[funcDefinition.functionName] = funcDefinition.nativeFunction;
}

export function getLatestTelemetry(telemetry = [], opts = {}) {
    let latest = [];
    let timeFormat = opts.timeFormat || 'utc';

    if (telemetry.length) {
        latest = telemetry.reduce((prev, cur) => {
            return prev[timeFormat] > cur[timeFormat] ? prev : cur;
        });
    }

    return latest;
}

// EXAMPLE:
// getMockObjects({
//     name: 'Jamie Telemetry',
//     keys: ['test','other','yeah','sup'],
//     format: 'local',
//     telemetryConfig: {
//          hints: {
//              test: {
//                  domain: 1
//              },
//              other: {
//                  range: 2
//              }
//          }
//      }
// })
export function getMockObjects(opts = {}) {
    opts.type = opts.type || 'default';
    if (opts.objectKeyStrings && !Array.isArray(opts.objectKeyStrings)) {
        throw `"getMockObjects" optional parameter "objectKeyStrings" must be an array of string object keys`;
    }

    let requestedMocks = {};

    if (!opts.objectKeyStrings) {
        requestedMocks = copyObj(mockObjects[opts.type]);
    } else {
        opts.objectKeyStrings.forEach(objKey => {
            if (mockObjects[opts.type] && mockObjects[opts.type][objKey]) {
                requestedMocks[objKey] = copyObj(mockObjects[opts.type][objKey]);
            } else {
                throw `No mock object for object key "${objKey}" of type "${opts.type}"`;
            }
        });
    }

    // build out custom telemetry mappings if necessary
    if (requestedMocks.telemetry && opts.telemetryConfig) {
        let keys = opts.telemetryConfig.keys;
        let format = opts.telemetryConfig.format || 'utc';
        let hints = opts.telemetryConfig.hints;
        let values;

        // if utc, keep default
        if (format === 'utc') {
            // save for later if new keys
            if (keys) {
                format = requestedMocks.telemetry
                    .telemetry.values.find((vals) => vals.key === 'utc');
            }
        } else {
            format = {
                key: format,
                name: "Time",
                format: format === 'local' ? 'local-format' : format,
                hints: {
                    domain: 1
                }
            };
        }

        if (keys) {
            values = keys.map((key) => ({
                key,
                name: key + ' attribute'
            }));
            values.push(format); // add time format back in
        } else {
            values = requestedMocks.telemetry.telemetry.values;
        }

        if (hints) {
            for (let val of values) {
                if (hints[val.key]) {
                    val.hints = hints[val.key];
                }
            }
        }

        requestedMocks.telemetry.telemetry.values = values;
    }

    // overwrite any field keys
    if (opts.overwrite) {
        for (let mock in requestedMocks) {
            if (opts.overwrite[mock]) {
                requestedMocks[mock] = Object.assign(requestedMocks[mock], opts.overwrite[mock]);
            }
        }
    }

    return requestedMocks;
}

// EXAMPLE:
// getMockTelemetry({
//     name: 'My Telemetry',
//     keys: ['test','other','yeah','sup'],
//     count: 8,
//     format: 'local'
// })
export function getMockTelemetry(opts = {}) {
    let count = opts.count || 2;
    let format = opts.format || 'utc';
    let name = opts.name || 'Mock Telemetry Datum';
    let keyCount = 2;
    let keys = false;
    let telemetry = [];

    if (opts.keys && Array.isArray(opts.keys)) {
        keyCount = opts.keys.length;
        keys = opts.keys;
    } else if (opts.keyCount) {
        keyCount = opts.keyCount;
    }

    for (let i = 1; i < count + 1; i++) {
        let datum = {
            [format]: i,
            name
        };

        for (let k = 1; k < keyCount + 1; k++) {
            let key = keys ? keys[k - 1] : 'some-key-' + k;
            let value = keys ? keys[k - 1] + ' value ' + i : 'some value ' + i + '-' + k;
            datum[key] = value;
        }

        telemetry.push(datum);
    }

    return telemetry;
}

// copy objects a bit more easily
function copyObj(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// add any other necessary types to this mockObjects object
function setMockObjects() {
    return {
        default: {
            folder: {
                identifier: {
                    namespace: "",
                    key: "folder-object"
                },
                name: "Test Folder Object",
                type: "folder",
                composition: [],
                location: "mine"
            },
            ladTable: {
                identifier: {
                    namespace: "",
                    key: "lad-object"
                },
                type: 'LadTable',
                composition: []
            },
            ladTableSet: {
                identifier: {
                    namespace: "",
                    key: "lad-set-object"
                },
                type: 'LadTableSet',
                composition: []
            },
            telemetry: {
                identifier: {
                    namespace: "",
                    key: "telemetry-object"
                },
                type: "test-telemetry-object",
                name: "Test Telemetry Object",
                telemetry: {
                    values: [{
                        key: "name",
                        name: "Name",
                        format: "string"
                    }, {
                        key: "utc",
                        name: "Time",
                        format: "utc",
                        hints: {
                            domain: 1
                        }
                    }, {
                        name: "Some attribute 1",
                        key: "some-key-1",
                        hints: {
                            range: 1
                        }
                    }, {
                        name: "Some attribute 2",
                        key: "some-key-2"
                    }]
                }
            }
        },
        otherType: {
            example: {}
        }
    };
}
