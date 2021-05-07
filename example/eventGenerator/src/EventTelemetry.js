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
 * Module defining EventTelemetry.
 * Created by chacskaylo on 06/18/2015.
 * Modified by shale on 06/23/2015.
 */
define(
    ['../data/transcript.json'],
    function (messages) {
        "use strict";

        var firstObservedTime = Date.now();

        function EventTelemetry(request, interval) {

            var latestObservedTime = Date.now(),
                count = Math.floor((latestObservedTime - firstObservedTime) / interval),
                generatorData = {};

            generatorData.getPointCount = function () {
                return count;
            };

            generatorData.getDomainValue = function (i, domain) {
                return i * interval
                        + (domain !== 'delta' ? firstObservedTime : 0);
            };

            generatorData.getRangeValue = function (i, range) {
                var domainDelta = this.getDomainValue(i) - firstObservedTime,
                    ind = i % messages.length;

                return messages[ind] + " - [" + domainDelta.toString() + "]";
            };

            return generatorData;
        }

        return EventTelemetry;
    }
);
