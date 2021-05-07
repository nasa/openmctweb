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
    'objectUtils'
], function (
    utils
) {
    /**
     * @implements module:openmct.TelemetryAPI~TelemetryProvider
     * @constructor
     */
    function LegacyTelemetryProvider(openmct, instantiate) {
        this.telemetryApi = openmct.telemetry;
        this.instantiate = instantiate;
    }

    /**
     * Can provide telemetry for all objects that have the "telemetry"
     * capability
     *
     * @see module:openmct.TelemetryAPI~TelemetryProvider#canProvideTelemetry
     */
    LegacyTelemetryProvider.prototype.canProvideTelemetry = function (domainObject) {
        return this.instantiate(utils.toOldFormat(domainObject),
            utils.makeKeyString(domainObject.identifier)).hasCapability("telemetry");
    };

    LegacyTelemetryProvider.prototype.supportsRequest =
        LegacyTelemetryProvider.prototype.supportsSubscribe =
        LegacyTelemetryProvider.prototype.canProvideTelemetry;

    function createDatum(domainObject, metadata, legacySeries, i) {
        let datum;

        if (legacySeries.getDatum) {
            datum = legacySeries.getDatum(i);
        } else {
            datum = {};
            metadata.valuesForHints(['domain']).forEach(function (metadatum) {
                datum[metadatum.key] = legacySeries.getDomainValue(i, metadatum.key);
            });

            metadata.valuesForHints(['range']).forEach(function (metadatum) {
                datum[metadatum.key] = legacySeries.getRangeValue(i, metadatum.key);
            });
        }

        /**
         * If telemetry metadata defines a 'name' field, and one is not present
         * on the datum, add it.
         */
        if (metadata.value('name') !== undefined && datum.name === undefined) {
            datum.name = domainObject.name;
        }

        return datum;
    }

    function adaptSeries(domainObject, metadata, legacySeries) {
        const series = [];

        for (let i = 0; i < legacySeries.getPointCount(); i++) {
            series.push(createDatum(domainObject, metadata, legacySeries, i));
        }

        return series;
    }

    /**
     * @typedef {object} ConvertedTelemetryObject
     * Telemetry data objects are converted from TelemetrySeries. Metadata is used
     * to populate the returned object with attributes corresponding to the keys
     * of domains and ranges. The attribute values are those returned by calls to
     * [TelemetrySeries.getDomainValue()]{@link TelemetrySeries#getDomainValue}
     * and [TelemetrySeries.getRangeValue()]{@link TelemetrySeries#getRangeValue}.
     */

    /**
     * @see module:openmct.TelemetryAPI~TelemetryProvider#request
     * @param {module:openmct.DomainObject}
     * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
     *        options for this request. Passed straight through to legacy provider
     * @returns {Promise.<ConvertedTelemetryObject[]>} a promise for an array of
     *          telemetry data.
     */
    LegacyTelemetryProvider.prototype.request = function (domainObject, request) {
        const metadata = this.telemetryApi.getMetadata(domainObject);
        const oldObject = this.instantiate(utils.toOldFormat(domainObject), utils.makeKeyString(domainObject.identifier));
        const capability = oldObject.getCapability("telemetry");

        return capability.requestData(request).then(function (telemetrySeries) {
            return Promise.resolve(adaptSeries(domainObject, metadata, telemetrySeries));
        }).catch(function (error) {
            return Promise.reject(error);
        });
    };

    /**
     * @callback LegacyTelemetryProvider~SubscribeCallback
     * @param {ConvertedTelemetryObject}
     */

    /**
     * @see module:openmct.TelemetryAPI~TelemetryProvider#request
     * @param {module:openmct.DomainObject}
     * @param {LegacyTelemetryProvider~SubscribeCallback} callback will be called with a single datum when
     * new data is available.
     * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
     *        options for this request. Passed straight through to legacy provider
     * @returns {platform|telemetry.TelemetrySubscription|*}
     */
    LegacyTelemetryProvider.prototype.subscribe = function (domainObject, callback, request) {
        const metadata = this.telemetryApi.getMetadata(domainObject);
        const oldObject = this.instantiate(utils.toOldFormat(domainObject), utils.makeKeyString(domainObject.identifier));
        const capability = oldObject.getCapability("telemetry");

        function callbackWrapper(series) {
            callback(createDatum(domainObject, metadata, series, series.getPointCount() - 1));
        }

        return capability.subscribe(callbackWrapper, request) || function () {};
    };

    LegacyTelemetryProvider.prototype.supportsLimits = function (domainObject) {
        const oldObject = this.instantiate(
            utils.toOldFormat(domainObject),
            utils.makeKeyString(domainObject.identifier)
        );

        return oldObject.hasCapability("limit");
    };

    LegacyTelemetryProvider.prototype.getLimitEvaluator = function (domainObject) {
        const oldObject = this.instantiate(
            utils.toOldFormat(domainObject),
            utils.makeKeyString(domainObject.identifier)
        );
        const limitEvaluator = oldObject.getCapability("limit");

        return {
            evaluate: function (datum, property) {
                return limitEvaluator.evaluate(datum, property && property.key);
            }
        };
    };

    return function (openmct, instantiate) {
        // Legacy provider should always be the fallback.
        const provider = new LegacyTelemetryProvider(openmct, instantiate);
        openmct.telemetry.legacyProvider = provider;
        openmct.telemetry.requestProviders.push(provider);
        openmct.telemetry.subscriptionProviders.push(provider);
        openmct.telemetry.limitProviders.push(provider);
    };

});
