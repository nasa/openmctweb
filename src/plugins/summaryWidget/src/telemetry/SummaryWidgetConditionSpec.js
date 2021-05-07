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

    describe('SummaryWidgetCondition', function () {
        let condition;
        let telemetryState;

        beforeEach(function () {
            // Format map intentionally uses different keys than those present
            // in datum, which serves to verify conditions use format map to get
            // data.
            const formatMap = {
                adjusted: {
                    parse: function (datum) {
                        return datum.value + 10;
                    }
                },
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

        it('can evaluate if a single object matches', function () {
            condition = new SummaryWidgetCondition({
                object: 'objectId',
                key: 'raw',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = 5;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

        it('can evaluate if a single object matches (alternate keys)', function () {
            condition = new SummaryWidgetCondition({
                object: 'objectId',
                key: 'adjusted',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = -5;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 5;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

        it('can evaluate "if all objects match"', function () {
            condition = new SummaryWidgetCondition({
                object: 'all',
                key: 'raw',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

        it('can evalute "if any object matches"', function () {
            condition = new SummaryWidgetCondition({
                object: 'any',
                key: 'raw',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

    });
});
