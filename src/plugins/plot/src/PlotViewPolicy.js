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

define(
    function () {

        /**
         * Policy preventing the Plot view from being made available for
         * domain objects which have non-numeric telemetry.
         * @implements {Policy.<View, DomainObject>}
         * @constructor
         * @memberof platform/features/plot
         */
        function PlotViewPolicy(openmct) {
            this.openmct = openmct;
        }

        PlotViewPolicy.prototype.hasNumericTelemetry = function (domainObject) {
            const adaptedObject = domainObject.useCapability('adapter');

            if (!adaptedObject.telemetry) {
                return domainObject.hasCapability('delegation')
                    && domainObject.getCapability('delegation')
                        .doesDelegateCapability('telemetry');
            }

            const metadata = this.openmct.telemetry.getMetadata(adaptedObject);
            const rangeValues = metadata.valuesForHints(['range']);
            if (rangeValues.length === 0) {
                return false;
            }

            return !rangeValues.every(function (value) {
                return value.format === 'string';
            });
        };

        PlotViewPolicy.prototype.allow = function (view, domainObject) {
            if (view.key === 'plot-single') {
                return this.hasNumericTelemetry(domainObject);
            }

            return true;
        };

        return PlotViewPolicy;
    }
);

