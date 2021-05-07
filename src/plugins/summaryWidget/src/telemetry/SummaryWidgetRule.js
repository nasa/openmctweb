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
    './SummaryWidgetCondition'
], function (
    SummaryWidgetCondition
) {
    function SummaryWidgetRule(definition) {
        this.name = definition.name;
        this.label = definition.label;
        this.id = definition.id;
        this.icon = definition.icon;
        this.style = definition.style;
        this.message = definition.message;
        this.description = definition.description;
        this.conditions = definition.conditions.map(function (cDefinition) {
            return new SummaryWidgetCondition(cDefinition);
        });
        this.trigger = definition.trigger;
    }

    /**
     * Evaluate the given rule against a telemetryState and return true if it
     * matches.
     */
    SummaryWidgetRule.prototype.evaluate = function (telemetryState) {
        let i;
        let result;

        if (this.trigger === 'all') {
            for (i = 0; i < this.conditions.length; i++) {
                result = this.conditions[i].evaluate(telemetryState);
                if (!result) {
                    return false;
                }
            }

            return true;
        } else if (this.trigger === 'any') {
            for (i = 0; i < this.conditions.length; i++) {
                result = this.conditions[i].evaluate(telemetryState);
                if (result) {
                    return true;
                }
            }

            return false;
        } else {
            throw new Error('Invalid rule trigger: ' + this.trigger);
        }
    };

    return SummaryWidgetRule;
});

