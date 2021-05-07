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
 * Module defining UrlService.
 */
define(
    [],
    function () {

        /**
         * The url service handles calls for url paths
         * using domain objects.
         * @constructor
         * @memberof platform/commonUI/general
         */
        function UrlService($location) {
            this.$location = $location;
        }

        /**
         * Returns the Url path for a specific domain object
         * without the index.html path and the view path
         * @param {string} mode value of browse or edit mode
         *        for the path
         * @param {DomainObject} value of the domain object
         *        to get the path of
         * @returns {string} URL for the domain object
         */
        UrlService.prototype.urlForLocation = function (mode, domainObject) {
            var context = domainObject
                    && domainObject.getCapability('context'),
                objectPath = context ? context.getPath() : [],
                ids = objectPath.map(function (domainObj) {
                    return domainObj.getId();
                });

            // Parses the path together. Starts with the
            // default index.html file, then the mode passed
            // into the service, followed by ids in the url
            // joined by '/', and lastly the view path from
            // the current location
            return mode + "/" + ids.slice(1).join("/");
        };

        /**
         * Returns the Url path for a specific domain object
         * including the index.html path and the view path
         * allowing a new tab to hold the correct characteristics
         * @param {string} mode value of browse or edit mode
         *        for the path
         * @param {DomainObject} value of the domain object
         *        to get the path of
         * @returns {string} URL for the domain object
         */
        UrlService.prototype.urlForNewTab = function (mode, domainObject) {
            var search = this.$location.search(),
                arr = [];
            for (var key in search) {
                if (Object.prototype.hasOwnProperty.call(search, key)) {
                    arr.push(key + '=' + search[key]);
                }
            }

            var searchPath = "?" + arr.join('&'),
                newTabPath =
                    "#" + this.urlForLocation(mode, domainObject)
                            + searchPath;

            return newTabPath;
        };

        return UrlService;
    }
);
