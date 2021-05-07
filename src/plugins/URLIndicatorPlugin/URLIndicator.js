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
    ['zepto'],
    function ($) {

        // Set of connection states; changing among these states will be
        // reflected in the indicator's appearance.
        // CONNECTED: Everything nominal, expect to be able to read/write.
        // DISCONNECTED: HTTP failed; maybe misconfigured, disconnected.
        // PENDING: Still trying to connect, and haven't failed yet.
        const CONNECTED = {
            statusClass: "s-status-on"
        };
        const PENDING = {
            statusClass: "s-status-warning-lo"
        };
        const DISCONNECTED = {
            statusClass: "s-status-warning-hi"
        };
        function URLIndicator(options, simpleIndicator) {
            this.bindMethods();
            this.count = 0;

            this.indicator = simpleIndicator;
            this.setDefaultsFromOptions(options);
            this.setIndicatorToState(PENDING);

            this.fetchUrl();
            setInterval(this.fetchUrl, this.interval);
        }

        URLIndicator.prototype.setIndicatorToState = function (state) {
            switch (state) {
            case CONNECTED: {
                this.indicator.text(this.label + " is connected");
                this.indicator.description(this.label + " is online, checking status every " + this.interval + " milliseconds.");
                break;
            }

            case PENDING: {
                this.indicator.text("Checking status of " + this.label + " please stand by...");
                this.indicator.description("Checking status of " + this.label + " please stand by...");
                break;
            }

            case DISCONNECTED: {
                this.indicator.text(this.label + " is offline");
                this.indicator.description(this.label + " is offline, checking status every " + this.interval + " milliseconds");
                break;
            }
            }

            this.indicator.statusClass(state.statusClass);
        };

        URLIndicator.prototype.fetchUrl = function () {
            $.ajax({
                type: 'GET',
                url: this.URLpath,
                success: this.handleSuccess,
                error: this.handleError
            });
        };

        URLIndicator.prototype.handleError = function (e) {
            this.setIndicatorToState(DISCONNECTED);
        };

        URLIndicator.prototype.handleSuccess = function () {
            this.setIndicatorToState(CONNECTED);
        };

        URLIndicator.prototype.setDefaultsFromOptions = function (options) {
            this.URLpath = options.url;
            this.label = options.label || options.url;
            this.interval = options.interval || 10000;
            this.indicator.iconClass(options.iconClass || 'icon-chain-links');
        };

        URLIndicator.prototype.bindMethods = function () {
            this.fetchUrl = this.fetchUrl.bind(this);
            this.handleSuccess = this.handleSuccess.bind(this);
            this.handleError = this.handleError.bind(this);
            this.setIndicatorToState = this.setIndicatorToState.bind(this);
        };

        return URLIndicator;
    });
