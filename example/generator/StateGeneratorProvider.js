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

define([

], function (

) {

    function StateGeneratorProvider() {

    }

    function pointForTimestamp(timestamp, duration, name) {
        return {
            name: name,
            utc: Math.floor(timestamp / duration) * duration,
            value: Math.floor(timestamp / duration) % 2
        };
    }

    StateGeneratorProvider.prototype.supportsSubscribe = function (domainObject) {
        return domainObject.type === 'example.state-generator';
    };

    StateGeneratorProvider.prototype.subscribe = function (domainObject, callback) {
        var duration = domainObject.telemetry.duration * 1000;

        var interval = setInterval(function () {
            var now = Date.now();
            var datum = pointForTimestamp(now, duration, domainObject.name);
            datum.value = String(datum.value);
            callback(datum);
        }, duration);

        return function () {
            clearInterval(interval);
        };
    };

    StateGeneratorProvider.prototype.supportsRequest = function (domainObject, options) {
        return domainObject.type === 'example.state-generator';
    };

    StateGeneratorProvider.prototype.request = function (domainObject, options) {
        var start = options.start;
        var end = options.end;
        var duration = domainObject.telemetry.duration * 1000;
        if (options.strategy === 'latest' || options.size === 1) {
            start = end;
        }

        var data = [];
        while (start <= end && data.length < 5000) {
            data.push(pointForTimestamp(start, duration, domainObject.name));
            start += duration;
        }

        return Promise.resolve(data);
    };

    return StateGeneratorProvider;

});
