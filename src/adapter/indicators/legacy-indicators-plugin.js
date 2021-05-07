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
    const LEGACY_INDICATOR_TEMPLATE =
        '<mct-include '
        + '   ng-model="indicator" '
        + '   class="h-indicator" '
        + '   key="template">'
        + ' </mct-include>';

    return function () {
        return function (openmct) {
            openmct.legacyExtension('runs', {
                depends: ['indicators[]'],
                implementation: addLegacyIndicators
            });

            function addLegacyIndicators(legacyIndicators) {
                legacyIndicators.forEach(function (legacyIndicatorDef) {
                    const legacyIndicator = initializeIfNeeded(legacyIndicatorDef);
                    const legacyIndicatorElement = buildLegacyIndicator(legacyIndicator, legacyIndicatorDef.template);
                    openmct.indicators.add({
                        element: legacyIndicatorElement
                    });
                });
            }

            function initializeIfNeeded(LegacyIndicatorDef) {
                let legacyIndicator;
                if (typeof LegacyIndicatorDef === 'function') {
                    legacyIndicator = new LegacyIndicatorDef();
                } else {
                    legacyIndicator = LegacyIndicatorDef;
                }

                return legacyIndicator;
            }

            function buildLegacyIndicator(legacyIndicator, template) {
                const $compile = openmct.$injector.get('$compile');
                const $rootScope = openmct.$injector.get('$rootScope');
                const scope = $rootScope.$new(true);
                scope.indicator = legacyIndicator;
                scope.template = template || 'indicator';

                return $compile(LEGACY_INDICATOR_TEMPLATE)(scope)[0];
            }
        };
    };
});
