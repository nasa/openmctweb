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

define([], function () {

    function MockTelemetryApi() {
        this.createSpy('subscribe');
        this.createSpy('getMetadata');

        this.metadata = this.createMockMetadata();
        this.setDefaultRangeTo('defaultRange');
        this.unsubscribe = jasmine.createSpy('unsubscribe');
        this.mockReceiveTelemetry = this.mockReceiveTelemetry.bind(this);
    }

    MockTelemetryApi.prototype.subscribe = function () {
        return this.unsubscribe;
    };

    MockTelemetryApi.prototype.getMetadata = function (object) {
        return this.metadata;
    };

    MockTelemetryApi.prototype.request = jasmine.createSpy('request');

    MockTelemetryApi.prototype.getValueFormatter = function (valueMetadata) {
        const mockValueFormatter = jasmine.createSpyObj("valueFormatter", [
            "parse"
        ]);

        mockValueFormatter.parse.and.callFake(function (value) {
            return value[valueMetadata.key];
        });

        return mockValueFormatter;
    };

    MockTelemetryApi.prototype.mockReceiveTelemetry = function (newTelemetryDatum) {
        const subscriptionCallback = this.subscribe.calls.mostRecent().args[1];
        subscriptionCallback(newTelemetryDatum);
    };

    /**
     * @private
     */
    MockTelemetryApi.prototype.onRequestReturn = function (telemetryData) {
        this.requestTelemetry = telemetryData;
    };

    /**
     * @private
     */
    MockTelemetryApi.prototype.setDefaultRangeTo = function (rangeKey) {
        const mockMetadataValue = {
            key: rangeKey
        };
        this.metadata.valuesForHints.and.returnValue([mockMetadataValue]);
    };

    /**
     * @private
     */
    MockTelemetryApi.prototype.createMockMetadata = function () {
        const mockMetadata = jasmine.createSpyObj("metadata", [
            'value',
            'valuesForHints'
        ]);

        mockMetadata.value.and.callFake(function (key) {
            return {
                key: key
            };
        });

        return mockMetadata;
    };

    /**
     * @private
     */
    MockTelemetryApi.prototype.createSpy = function (functionName) {
        this[functionName] = this[functionName].bind(this);
        spyOn(this, functionName);
        this[functionName].and.callThrough();
    };

    return MockTelemetryApi;
});
