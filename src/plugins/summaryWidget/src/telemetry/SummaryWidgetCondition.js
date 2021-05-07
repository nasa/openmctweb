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
    './operations'
], function (
    OPERATIONS
) {

    function SummaryWidgetCondition(definition) {
        this.object = definition.object;
        this.key = definition.key;
        this.values = definition.values;
        if (!definition.operation) {
            // TODO: better handling for default rule.
            this.evaluate = function () {
                return true;
            };
        } else {
            this.comparator = OPERATIONS[definition.operation].operation;
        }
    }

    SummaryWidgetCondition.prototype.evaluate = function (telemetryState) {
        const stateKeys = Object.keys(telemetryState);
        let state;
        let result;
        let i;

        if (this.object === 'any') {
            for (i = 0; i < stateKeys.length; i++) {
                state = telemetryState[stateKeys[i]];
                result = this.evaluateState(state);
                if (result) {
                    return true;
                }
            }

            return false;
        } else if (this.object === 'all') {
            for (i = 0; i < stateKeys.length; i++) {
                state = telemetryState[stateKeys[i]];
                result = this.evaluateState(state);
                if (!result) {
                    return false;
                }
            }

            return true;
        } else {
            return this.evaluateState(telemetryState[this.object]);
        }
    };

    SummaryWidgetCondition.prototype.evaluateState = function (state) {
        const testValues = [
            state.formats[this.key].parse(state.lastDatum)
        ].concat(this.values);

        return this.comparator(testValues);
    };

    return SummaryWidgetCondition;
});
