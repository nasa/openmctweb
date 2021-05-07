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

import TelemetryCriterion from "./TelemetryCriterion";
import { getMockTelemetry } from "utils/testing";

let openmct = {};
let mockListener;
let testCriterionDefinition;
let testTelemetryObject;
let telemetryCriterion;
let mockTelemetry = getMockTelemetry();

describe("The telemetry criterion", function () {

    beforeEach (() => {
        testTelemetryObject = {
            identifier: {
                namespace: "",
                key: "test-object"
            },
            type: "test-object",
            name: "Test Object",
            telemetry: {
                valueMetadatas: [{
                    key: "value",
                    name: "Value",
                    hints: {
                        range: 2
                    }
                },
                {
                    key: "utc",
                    name: "Time",
                    format: "utc",
                    hints: {
                        domain: 1
                    }
                }, {
                    key: "testSource",
                    source: "value",
                    name: "Test",
                    format: "string"
                }]
            }
        };
        openmct.objects = jasmine.createSpyObj('objects', ['get', 'makeKeyString']);
        openmct.objects.makeKeyString.and.returnValue(testTelemetryObject.identifier.key);
        openmct.telemetry = jasmine.createSpyObj('telemetry', ['isTelemetryObject', "subscribe", "getMetadata", "getValueFormatter", "request"]);
        openmct.telemetry.isTelemetryObject.and.returnValue(true);
        openmct.telemetry.subscribe.and.returnValue(function () {});
        openmct.telemetry.getValueFormatter.and.returnValue({
            parse: function (value) {
                return value;
            }
        });
        openmct.telemetry.getMetadata.and.returnValue(testTelemetryObject.telemetry);

        openmct.time = jasmine.createSpyObj('timeAPI',
            ['timeSystem', 'bounds', 'getAllTimeSystems']
        );
        openmct.time.timeSystem.and.returnValue({key: 'system'});
        openmct.time.bounds.and.returnValue({
            start: 0,
            end: 1
        });
        openmct.time.getAllTimeSystems.and.returnValue([{key: 'system'}]);

        testCriterionDefinition = {
            id: 'test-criterion-id',
            telemetry: openmct.objects.makeKeyString(testTelemetryObject.identifier),
            operation: 'textContains',
            metadata: 'value',
            input: ['Hell'],
            telemetryObjects: {[testTelemetryObject.identifier.key]: testTelemetryObject}
        };

        mockListener = jasmine.createSpy('listener');

        telemetryCriterion = new TelemetryCriterion(
            testCriterionDefinition,
            openmct
        );

        telemetryCriterion.on('criterionResultUpdated', mockListener);

    });

    it("initializes with a telemetry objectId as string", function () {
        expect(telemetryCriterion.telemetryObjectIdAsString).toEqual(testTelemetryObject.identifier.key);
    });

    it("returns a result on new data from relevant telemetry providers", function () {
        telemetryCriterion.updateResult({
            value: 'Hello',
            utc: 'Hi',
            id: testTelemetryObject.identifier.key
        });
        expect(telemetryCriterion.result).toBeTrue();
    });

    describe('the LAD request', () => {
        beforeEach(() => {
            let telemetryRequestResolve;
            let telemetryRequestPromise = new Promise((resolve) => {
                telemetryRequestResolve = resolve;
            });
            openmct.telemetry.request.and.callFake(() => {
                setTimeout(() => {
                    telemetryRequestResolve(mockTelemetry);
                }, 100);

                return telemetryRequestPromise;
            });
        });

        it("returns results for slow LAD requests", function () {
            const criteriaRequest = telemetryCriterion.requestLAD();
            telemetryCriterion.destroy();
            expect(telemetryCriterion.telemetryObject).toBeUndefined();
            setTimeout(() => {
                criteriaRequest.then((result) => {
                    expect(result).toBeDefined();
                });
            }, 300);
        });
    });
});
