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
define(function () {
    class TelemetryTableColumn {
        constructor(openmct, metadatum, options = {selectable: false}) {
            this.metadatum = metadatum;
            this.formatter = openmct.telemetry.getValueFormatter(metadatum);
            this.titleValue = this.metadatum.name;
            this.selectable = options.selectable;
        }

        getKey() {
            return this.metadatum.key;
        }

        getTitle() {
            return this.metadatum.name;
        }

        getMetadatum() {
            return this.metadatum;
        }

        hasValueForDatum(telemetryDatum) {
            return Object.prototype.hasOwnProperty.call(telemetryDatum, this.metadatum.source);
        }

        getRawValue(telemetryDatum) {
            return telemetryDatum[this.metadatum.source];
        }

        getFormattedValue(telemetryDatum) {
            let formattedValue = this.formatter.format(telemetryDatum);
            if (formattedValue !== undefined && typeof formattedValue !== 'string') {
                return formattedValue.toString();
            } else {
                return formattedValue;
            }
        }

        getParsedValue(telemetryDatum) {
            return this.formatter.parse(telemetryDatum);
        }
    }

    return TelemetryTableColumn;
});
