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
    './SummaryWidgetRule'
], function (
    SummaryWidgetRule
) {
    describe('SummaryWidgetRule', function () {

        let rule;
        let telemetryState;

        beforeEach(function () {
            const formatMap = {
                raw: {
                    parse: function (datum) {
                        return datum.value;
                    }
                }
            };

            telemetryState = {
                objectId: {
                    formats: formatMap,
                    lastDatum: {
                    }
                },
                otherObjectId: {
                    formats: formatMap,
                    lastDatum: {
                    }
                }
            };
        });

        it('allows single condition rules with any', function () {
            rule = new SummaryWidgetRule({
                trigger: 'any',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            expect(rule.evaluate(telemetryState)).toBe(true);
        });

        it('allows single condition rules with all', function () {
            rule = new SummaryWidgetRule({
                trigger: 'all',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            expect(rule.evaluate(telemetryState)).toBe(true);
        });

        it('can combine multiple conditions with all', function () {
            rule = new SummaryWidgetRule({
                trigger: 'all',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }, {
                    object: 'otherObjectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        20
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(true);

        });

        it('can combine multiple conditions with any', function () {
            rule = new SummaryWidgetRule({
                trigger: 'any',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }, {
                    object: 'otherObjectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        20
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(true);
        });
    });
});
