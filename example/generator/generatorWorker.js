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

(function () {

    var FIFTEEN_MINUTES = 15 * 60 * 1000;

    var handlers = {
        subscribe: onSubscribe,
        unsubscribe: onUnsubscribe,
        request: onRequest
    };

    var subscriptions = {};

    function workSubscriptions(timestamp) {
        var now = Date.now();
        var nextWork = Math.min.apply(Math, Object.values(subscriptions).map(function (subscription) {
            return subscription(now);
        }));
        var wait = nextWork - now;
        if (wait < 0) {
            wait = 0;
        }

        if (Number.isFinite(wait)) {
            setTimeout(workSubscriptions, wait);
        }
    }

    function onSubscribe(message) {
        var data = message.data;

        // Keep
        var start = Date.now();
        var step = 1000 / data.dataRateInHz;
        var nextStep = start - (start % step) + step;

        function work(now) {
            while (nextStep < now) {
                self.postMessage({
                    id: message.id,
                    data: {
                        name: data.name,
                        utc: nextStep,
                        yesterday: nextStep - 60 * 60 * 24 * 1000,
                        sin: sin(nextStep, data.period, data.amplitude, data.offset, data.phase, data.randomness),
                        cos: cos(nextStep, data.period, data.amplitude, data.offset, data.phase, data.randomness)
                    }
                });
                nextStep += step;
            }

            return nextStep;
        }

        subscriptions[message.id] = work;
        workSubscriptions();
    }

    function onUnsubscribe(message) {
        delete subscriptions[message.data.id];
    }

    function onRequest(message) {
        var request = message.data;
        if (request.end === undefined) {
            request.end = Date.now();
        }

        if (request.start === undefined) {
            request.start = request.end - FIFTEEN_MINUTES;
        }

        var now = Date.now();
        var start = request.start;
        var end = request.end > now ? now : request.end;
        var amplitude = request.amplitude;
        var period = request.period;
        var offset = request.offset;
        var dataRateInHz = request.dataRateInHz;
        var phase = request.phase;
        var randomness = request.randomness;

        var step = 1000 / dataRateInHz;
        var nextStep = start - (start % step) + step;

        var data = [];

        for (; nextStep < end && data.length < 5000; nextStep += step) {
            data.push({
                utc: nextStep,
                yesterday: nextStep - 60 * 60 * 24 * 1000,
                sin: sin(nextStep, period, amplitude, offset, phase, randomness),
                cos: cos(nextStep, period, amplitude, offset, phase, randomness)
            });
        }

        self.postMessage({
            id: message.id,
            data: data
        });
    }

    function cos(timestamp, period, amplitude, offset, phase, randomness) {
        return amplitude
            * Math.cos(phase + (timestamp / period / 1000 * Math.PI * 2)) + (amplitude * Math.random() * randomness) + offset;
    }

    function sin(timestamp, period, amplitude, offset, phase, randomness) {
        return amplitude
            * Math.sin(phase + (timestamp / period / 1000 * Math.PI * 2)) + (amplitude * Math.random() * randomness) + offset;
    }

    function sendError(error, message) {
        self.postMessage({
            error: error.name + ': ' + error.message,
            message: message,
            id: message.id
        });
    }

    self.onmessage = function handleMessage(event) {
        var message = event.data;
        var handler = handlers[message.request];

        if (!handler) {
            sendError(new Error('unknown message type'), message);
        } else {
            try {
                handler(message);
            } catch (e) {
                sendError(e, message);
            }
        }
    };

}());
