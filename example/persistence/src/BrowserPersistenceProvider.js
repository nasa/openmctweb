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

/**
 * Stubbed implementation of a persistence provider,
 * to permit objects to be created, saved, etc.
 */
define(
    [],
    function () {
        'use strict';

        function BrowserPersistenceProvider($q, SPACE) {
            var spaces = SPACE ? [SPACE] : [],
                caches = {},
                promises = {
                    as: function (value) {
                        return $q.when(value);
                    }
                };

            spaces.forEach(function (space) {
                caches[space] = {};
            });

            return {
                listSpaces: function () {
                    return promises.as(spaces);
                },
                listObjects: function (space) {
                    var cache = caches[space];

                    return promises.as(
                        cache ? Object.keys(cache) : null
                    );
                },
                createObject: function (space, key, value) {
                    var cache = caches[space];

                    if (!cache || cache[key]) {
                        return promises.as(null);
                    }

                    cache[key] = value;

                    return promises.as(true);
                },
                readObject: function (space, key) {
                    var cache = caches[space];

                    return promises.as(
                        cache ? cache[key] : null
                    );
                },
                updateObject: function (space, key, value) {
                    var cache = caches[space];

                    if (!cache || !cache[key]) {
                        return promises.as(null);
                    }

                    cache[key] = value;

                    return promises.as(true);
                },
                deleteObject: function (space, key, value) {
                    var cache = caches[space];

                    if (!cache || !cache[key]) {
                        return promises.as(null);
                    }

                    delete cache[key];

                    return promises.as(true);
                }
            };

        }

        return BrowserPersistenceProvider;
    }
);
