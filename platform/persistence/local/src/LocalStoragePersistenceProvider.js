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
    [],
    function () {

        /**
         * The LocalStoragePersistenceProvider reads and writes JSON documents
         * (more specifically, domain object models) to/from the browser's
         * local storage.
         * @memberof platform/persistence/local
         * @constructor
         * @implements {PersistenceService}
         * @param q Angular's $q, for promises
         * @param $interval Angular's $interval service
         * @param {string} space the name of the persistence space being served
         */
        function LocalStoragePersistenceProvider($window, $q, space) {
            this.$q = $q;
            this.space = space;
            this.spaces = space ? [space] : [];
            this.localStorage = $window.localStorage;
        }

        /**
         * Set a value in local storage.
         * @private
         */
        LocalStoragePersistenceProvider.prototype.setValue = function (key, value) {
            this.localStorage[key] = JSON.stringify(value);
        };

        /**
         * Get a value from local storage.
         * @private
         */
        LocalStoragePersistenceProvider.prototype.getValue = function (key) {
            return this.localStorage[key]
                ? JSON.parse(this.localStorage[key]) : {};
        };

        LocalStoragePersistenceProvider.prototype.listSpaces = function () {
            return this.$q.when(this.spaces);
        };

        LocalStoragePersistenceProvider.prototype.listObjects = function (space) {
            return this.$q.when(Object.keys(this.getValue(space)));
        };

        LocalStoragePersistenceProvider.prototype.createObject = function (space, key, value) {
            var spaceObj = this.getValue(space);
            spaceObj[key] = value;
            this.setValue(space, spaceObj);

            return this.$q.when(true);
        };

        LocalStoragePersistenceProvider.prototype.readObject = function (space, key) {
            var spaceObj = this.getValue(space);

            return this.$q.when(spaceObj[key]);
        };

        LocalStoragePersistenceProvider.prototype.deleteObject = function (space, key) {
            var spaceObj = this.getValue(space);
            delete spaceObj[key];
            this.setValue(space, spaceObj);

            return this.$q.when(true);
        };

        LocalStoragePersistenceProvider.prototype.updateObject =
            LocalStoragePersistenceProvider.prototype.createObject;

        return LocalStoragePersistenceProvider;
    }
);
