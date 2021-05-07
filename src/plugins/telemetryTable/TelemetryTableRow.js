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
    class TelemetryTableRow {
        constructor(datum, columns, objectKeyString, limitEvaluator) {
            this.columns = columns;

            this.datum = createNormalizedDatum(datum, columns);
            this.fullDatum = datum;
            this.limitEvaluator = limitEvaluator;
            this.objectKeyString = objectKeyString;
        }

        getFormattedDatum(headers) {
            return Object.keys(headers).reduce((formattedDatum, columnKey) => {
                formattedDatum[columnKey] = this.getFormattedValue(columnKey);

                return formattedDatum;
            }, {});
        }

        getFormattedValue(key) {
            let column = this.columns[key];

            return column && column.getFormattedValue(this.datum[key]);
        }

        getParsedValue(key) {
            let column = this.columns[key];

            return column && column.getParsedValue(this.datum[key]);
        }

        getCellComponentName(key) {
            let column = this.columns[key];

            return column
                && column.getCellComponentName
                && column.getCellComponentName();
        }

        getRowClass() {
            if (!this.rowClass) {
                let limitEvaluation = this.limitEvaluator.evaluate(this.datum);
                this.rowClass = limitEvaluation && limitEvaluation.cssClass;
            }

            return this.rowClass;
        }

        getCellLimitClasses() {
            if (!this.cellLimitClasses) {
                this.cellLimitClasses = Object.values(this.columns).reduce((alarmStateMap, column) => {
                    if (!column.isUnit) {
                        let limitEvaluation = this.limitEvaluator.evaluate(this.datum, column.getMetadatum());
                        alarmStateMap[column.getKey()] = limitEvaluation && limitEvaluation.cssClass;
                    }

                    return alarmStateMap;
                }, {});
            }

            return this.cellLimitClasses;
        }

        getContextualDomainObject(openmct, objectKeyString) {
            return openmct.objects.get(objectKeyString);
        }

        getContextMenuActions() {
            return ['viewDatumAction'];
        }
    }

    /**
     * Normalize the structure of datums to assist sorting and merging of columns.
     * Maps all sources to keys.
     * @private
     * @param {*} telemetryDatum
     * @param {*} metadataValues
     */
    function createNormalizedDatum(datum, columns) {
        const normalizedDatum = JSON.parse(JSON.stringify(datum));

        Object.values(columns).forEach(column => {
            normalizedDatum[column.getKey()] = column.getRawValue(datum);
        });

        return normalizedDatum;
    }

    return TelemetryTableRow;
});
