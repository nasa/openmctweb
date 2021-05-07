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

        // Set of connection states; changing among these states will be
        // reflected in the indicator's appearance.
        // CONNECTED: Everything nominal, expect to be able to read/write.
        // DISCONNECTED: HTTP failed; maybe misconfigured, disconnected.
        // PENDING: Still trying to connect, and haven't failed yet.
        var CONNECTED = {
                text: "Connected",
                glyphClass: "ok",
                statusClass: "s-status-on",
                description: "Connected to the domain object database."
            },
            DISCONNECTED = {
                text: "Disconnected",
                glyphClass: "err",
                statusClass: "s-status-caution",
                description: "Unable to connect to the domain object database."
            },
            PENDING = {
                text: "Checking connection..."
            };

        /**
         * Indicator for the current ElasticSearch connection. Polls
         * ElasticSearch at a regular interval (defined by bundle constants)
         * to ensure that the database is available.
         * @constructor
         * @memberof platform/persistence/elastic
         * @implements {Indicator}
         * @param $http Angular's $http service
         * @param $interval Angular's $interval service
         * @param {string} path the URL to poll for elasticsearch availability
         * @param {number} interval the interval, in milliseconds, to poll at
         */
        function ElasticIndicator($http, $interval, path, interval) {
            // Track the current connection state
            var self = this;

            this.state = PENDING;

            // Callback if the HTTP request to ElasticSearch fails
            function handleError() {
                self.state = DISCONNECTED;
            }

            // Callback if the HTTP request succeeds.
            function handleResponse() {
                self.state = CONNECTED;
            }

            // Try to connect to ElasticSearch, and update the indicator.
            function updateIndicator() {
                $http.get(path).then(handleResponse, handleError);
            }

            // Update the indicator initially, and start polling.
            updateIndicator();
            $interval(updateIndicator, interval, 0, false);
        }

        ElasticIndicator.prototype.getCssClass = function () {
            return "c-indicator--clickable icon-suitcase";
        };

        ElasticIndicator.prototype.getGlyphClass = function () {
            return this.state.glyphClass;
        };

        ElasticIndicator.prototype.getText = function () {
            return this.state.text;
        };

        ElasticIndicator.prototype.getDescription = function () {
            return this.state.description;
        };

        return ElasticIndicator;
    }
);
