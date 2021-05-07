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
        'use strict';

        /**
         * The ScratchPersistenceProvider keeps JSON documents in memory
         * and provides a persistence interface, but changes are lost on reload.
         * @memberof example/scratchpad
         * @constructor
         * @implements {PersistenceService}
         * @param q Angular's $q, for promises
         */
        function ScratchPersistenceProvider($q) {
            this.$q = $q;
            this.table = {};
        }

        ScratchPersistenceProvider.prototype.listSpaces = function () {
            return this.$q.when(['scratch']);
        };

        ScratchPersistenceProvider.prototype.listObjects = function (space) {
            return this.$q.when(
                space === 'scratch' ? Object.keys(this.table) : []
            );
        };

        ScratchPersistenceProvider.prototype.createObject = function (space, key, value) {
            if (space === 'scratch') {
                this.table[key] = JSON.stringify(value);
            }

            return this.$q.when(space === 'scratch');
        };

        ScratchPersistenceProvider.prototype.readObject = function (space, key) {
            return this.$q.when(
                (space === 'scratch' && this.table[key])
                    ? JSON.parse(this.table[key]) : undefined
            );
        };

        ScratchPersistenceProvider.prototype.deleteObject = function (space, key, value) {
            if (space === 'scratch') {
                delete this.table[key];
            }

            return this.$q.when(space === 'scratch');
        };

        ScratchPersistenceProvider.prototype.updateObject =
            ScratchPersistenceProvider.prototype.createObject;

        return ScratchPersistenceProvider;
    }
);
