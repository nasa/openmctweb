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
    'objectUtils',
    './TelemetryAverager'
], function (objectUtils, TelemetryAverager) {

    function MeanTelemetryProvider(openmct) {
        this.openmct = openmct;
        this.telemetryAPI = openmct.telemetry;
        this.timeAPI = openmct.time;
        this.objectAPI = openmct.objects;
        this.perObjectProviders = {};
    }

    MeanTelemetryProvider.prototype.canProvideTelemetry = function (domainObject) {
        return domainObject.type === 'telemetry-mean';
    };

    MeanTelemetryProvider.prototype.supportsRequest =
        MeanTelemetryProvider.prototype.supportsSubscribe =
            MeanTelemetryProvider.prototype.canProvideTelemetry;

    MeanTelemetryProvider.prototype.subscribe = function (domainObject, callback) {
        let wrappedUnsubscribe;
        let unsubscribeCalled = false;
        const objectId = objectUtils.parseKeyString(domainObject.telemetryPoint);
        const samples = domainObject.samples;

        this.objectAPI.get(objectId)
            .then(function (linkedDomainObject) {
                if (!unsubscribeCalled) {
                    wrappedUnsubscribe = this.subscribeToAverage(linkedDomainObject, samples, callback);
                }
            }.bind(this))
            .catch(logError);

        return function unsubscribe() {
            unsubscribeCalled = true;
            if (wrappedUnsubscribe !== undefined) {
                wrappedUnsubscribe();
            }
        };
    };

    MeanTelemetryProvider.prototype.subscribeToAverage = function (domainObject, samples, callback) {
        const telemetryAverager = new TelemetryAverager(this.telemetryAPI, this.timeAPI, domainObject, samples, callback);
        const createAverageDatum = telemetryAverager.createAverageDatum.bind(telemetryAverager);

        return this.telemetryAPI.subscribe(domainObject, createAverageDatum);
    };

    MeanTelemetryProvider.prototype.request = function (domainObject, request) {
        const objectId = objectUtils.parseKeyString(domainObject.telemetryPoint);
        const samples = domainObject.samples;

        return this.objectAPI.get(objectId).then(function (linkedDomainObject) {
            return this.requestAverageTelemetry(linkedDomainObject, request, samples);
        }.bind(this));
    };

    /**
     * @private
     */
    MeanTelemetryProvider.prototype.requestAverageTelemetry = function (domainObject, request, samples) {
        const averageData = [];
        const addToAverageData = averageData.push.bind(averageData);
        const telemetryAverager = new TelemetryAverager(this.telemetryAPI, this.timeAPI, domainObject, samples, addToAverageData);
        const createAverageDatum = telemetryAverager.createAverageDatum.bind(telemetryAverager);

        return this.telemetryAPI.request(domainObject, request).then(function (telemetryData) {
            telemetryData.forEach(createAverageDatum);

            return averageData;
        });
    };

    /**
     * @private
     */
    MeanTelemetryProvider.prototype.getLinkedObject = function (domainObject) {
        const objectId = objectUtils.parseKeyString(domainObject.telemetryPoint);

        return this.objectAPI.get(objectId);
    };

    function logError(error) {
        if (error.stack) {
            console.error(error.stack);
        } else {
            console.error(error);
        }
    }

    return MeanTelemetryProvider;
});
