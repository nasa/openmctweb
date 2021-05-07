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
import { TRIGGER } from "./constants";

export function evaluateResults(results, trigger) {
    if (trigger && trigger === TRIGGER.XOR) {
        return matchExact(results, 1);
    } else if (trigger && trigger === TRIGGER.NOT) {
        return matchExact(results, 0);
    } else if (trigger && trigger === TRIGGER.ALL) {
        return matchAll(results);
    } else {
        return matchAny(results);
    }
}

function matchAll(results) {
    for (let result of results) {
        if (result !== true) {
            return false;
        }
    }

    return true;
}

function matchAny(results) {
    for (let result of results) {
        if (result === true) {
            return true;
        }
    }

    return false;
}

function matchExact(results, target) {
    let matches = 0;
    for (let result of results) {
        if (result === true) {
            matches++;
        }

        if (matches > target) {
            return false;
        }
    }

    return matches === target;
}
