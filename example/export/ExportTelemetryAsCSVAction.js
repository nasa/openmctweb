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
    'use strict';

    /**
     * An example of using the `exportService`; queries for telemetry
     * and provides the results as a CSV file.
     * @param {platform/exporters.ExportService} exportService the
     *        service which will handle the CSV export
     * @param {ActionContext} context the action's context
     * @constructor
     * @memberof example/export
     * @implements {Action}
     */
    function ExportTelemetryAsCSVAction(exportService, context) {
        this.exportService = exportService;
        this.context = context;
    }

    ExportTelemetryAsCSVAction.prototype.perform = function () {
        var context = this.context,
            domainObject = context.domainObject,
            telemetry = domainObject.getCapability("telemetry"),
            metadata = telemetry.getMetadata(),
            domains = metadata.domains,
            ranges = metadata.ranges,
            exportService = this.exportService;

        function getName(domainOrRange) {
            return domainOrRange.name;
        }

        telemetry.requestData({}).then(function (series) {
            var headers = domains.map(getName).concat(ranges.map(getName)),
                rows = [],
                row,
                i;

            function copyDomainsToRow(telemetryRow, index) {
                domains.forEach(function (domain) {
                    telemetryRow[domain.name] = series.getDomainValue(index, domain.key);
                });
            }

            function copyRangesToRow(telemetryRow, index) {
                ranges.forEach(function (range) {
                    telemetryRow[range.name] = series.getRangeValue(index, range.key);
                });
            }

            for (i = 0; i < series.getPointCount(); i += 1) {
                row = {};
                copyDomainsToRow(row, i);
                copyRangesToRow(row, i);
                rows.push(row);
            }

            exportService.exportCSV(rows, { headers: headers });
        });
    };

    ExportTelemetryAsCSVAction.appliesTo = function (context) {
        return context.domainObject
            && context.domainObject.hasCapability("telemetry");
    };

    return ExportTelemetryAsCSVAction;
});
