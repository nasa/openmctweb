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
const DEFAULTS = [
    'src/adapter',
    'platform/framework',
    'platform/core',
    'platform/representation',
    'platform/commonUI/about',
    'platform/commonUI/browse',
    'platform/commonUI/edit',
    'platform/commonUI/dialog',
    'platform/commonUI/formats',
    'platform/commonUI/general',
    'platform/commonUI/inspect',
    'platform/commonUI/mobile',
    'platform/commonUI/notification',
    'platform/containment',
    'platform/execution',
    'platform/exporters',
    'platform/telemetry',
    'platform/features/clock',
    'platform/features/hyperlink',
    'platform/features/timeline',
    'platform/forms',
    'platform/identity',
    'platform/persistence/aggregator',
    'platform/persistence/queue',
    'platform/policy',
    'platform/entanglement',
    'platform/search',
    'platform/status',
    'platform/commonUI/regions'
];

define([
    '../src/adapter/bundle',
    '../example/eventGenerator/bundle',
    '../example/export/bundle',
    '../example/forms/bundle',
    '../example/identity/bundle',
    '../example/mobile/bundle',
    '../example/msl/bundle',
    '../example/notifications/bundle',
    '../example/persistence/bundle',
    '../example/policy/bundle',
    '../example/profiling/bundle',
    '../example/scratchpad/bundle',
    '../example/styleguide/bundle',
    '../platform/commonUI/about/bundle',
    '../platform/commonUI/browse/bundle',
    '../platform/commonUI/dialog/bundle',
    '../platform/commonUI/edit/bundle',
    '../platform/commonUI/formats/bundle',
    '../platform/commonUI/general/bundle',
    '../platform/commonUI/inspect/bundle',
    '../platform/commonUI/mobile/bundle',
    '../platform/commonUI/notification/bundle',
    '../platform/commonUI/regions/bundle',
    '../platform/containment/bundle',
    '../platform/core/bundle',
    '../platform/entanglement/bundle',
    '../platform/execution/bundle',
    '../platform/exporters/bundle',
    '../platform/features/clock/bundle',
    '../platform/features/my-items/bundle',
    '../platform/features/hyperlink/bundle',
    '../platform/features/static-markup/bundle',
    '../platform/features/timeline/bundle',
    '../platform/forms/bundle',
    '../platform/framework/bundle',
    '../platform/framework/src/load/Bundle',
    '../platform/identity/bundle',
    '../platform/persistence/aggregator/bundle',
    '../platform/persistence/elastic/bundle',
    '../platform/persistence/local/bundle',
    '../platform/persistence/queue/bundle',
    '../platform/policy/bundle',
    '../platform/representation/bundle',
    '../platform/search/bundle',
    '../platform/status/bundle',
    '../platform/telemetry/bundle'
], function () {
    const LEGACY_BUNDLES = Array.from(arguments);

    return function installDefaultBundles(bundleRegistry) {
        registerLegacyBundles(LEGACY_BUNDLES);
        enableDefaultBundles();

        function registerLegacyBundles(bundles) {
            bundles.forEach((bundle, i) => {
                bundleRegistry.register(bundle.name, bundle.definition);
            });
        }

        function enableDefaultBundles() {
            DEFAULTS.forEach(function (bundlePath) {
                bundleRegistry.enable(bundlePath);
            });
        }
    };
});
