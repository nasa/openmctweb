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

    function BundleRegistry() {
        this.bundles = {};
        this.knownBundles = {};
    }

    BundleRegistry.prototype.register = function (path, definition) {
        if (Object.prototype.hasOwnProperty.call(this.knownBundles, path)) {
            throw new Error('Cannot register bundle with duplicate path', path);
        }

        this.knownBundles[path] = definition;
    };

    BundleRegistry.prototype.enable = function (path) {
        if (!this.knownBundles[path]) {
            throw new Error('Unknown bundle ' + path);
        }

        this.bundles[path] = this.knownBundles[path];
    };

    BundleRegistry.prototype.disable = function (path) {
        if (!this.bundles[path]) {
            throw new Error('Tried to disable inactive bundle ' + path);
        }

        delete this.bundles[path];
    };

    BundleRegistry.prototype.contains = function (path) {
        return Boolean(this.bundles[path]);
    };

    BundleRegistry.prototype.get = function (path) {
        return this.bundles[path];
    };

    BundleRegistry.prototype.list = function () {
        return Object.keys(this.bundles);
    };

    BundleRegistry.prototype.remove = BundleRegistry.prototype.disable;

    BundleRegistry.prototype.delete = function (path) {
        if (!this.knownBundles[path]) {
            throw new Error('Cannot remove Unknown Bundle ' + path);
        }

        delete this.bundles[path];
        delete this.knownBundles[path];
    };

    return BundleRegistry;
});
