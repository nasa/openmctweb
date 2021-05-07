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
    './EvaluatorPool'
], function (
    EvaluatorPool
) {

    function SummaryWidgetTelemetryProvider(openmct) {
        this.pool = new EvaluatorPool(openmct);
    }

    SummaryWidgetTelemetryProvider.prototype.supportsRequest = function (domainObject, options) {
        return domainObject.type === 'summary-widget';
    };

    SummaryWidgetTelemetryProvider.prototype.request = function (domainObject, options) {
        if (options.strategy !== 'latest' && options.size !== 1) {
            return Promise.resolve([]);
        }

        const evaluator = this.pool.get(domainObject);

        return evaluator.requestLatest(options)
            .then(function (latestDatum) {
                this.pool.release(evaluator);

                return latestDatum ? [latestDatum] : [];
            }.bind(this));
    };

    SummaryWidgetTelemetryProvider.prototype.supportsSubscribe = function (domainObject) {
        return domainObject.type === 'summary-widget';
    };

    SummaryWidgetTelemetryProvider.prototype.subscribe = function (domainObject, callback) {
        const evaluator = this.pool.get(domainObject);
        const unsubscribe = evaluator.subscribe(callback);

        return function () {
            this.pool.release(evaluator);
            unsubscribe();
        }.bind(this);
    };

    return SummaryWidgetTelemetryProvider;
});
