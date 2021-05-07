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

        var ERROR_PREFIX = "Error when notifying listener: ";

        /**
         * The `topic` service provides a way to create both named,
         * shared listeners and anonymous, private listeners.
         *
         * Usage:
         *
         * ```
         * var t = topic('foo'); // Use/create a named topic
         * t.listen(function () { ... });
         * t.notify({ some: "message" });
         * ```
         *
         * Named topics are shared; multiple calls to `topic`
         * with the same argument will return a single object instance.
         * Anonymous topics (where `topic` has been called with no
         * arguments) are private; each call returns a new instance.
         *
         * @returns {Function}
         * @memberof platform/core
         */
        function Topic($log) {
            var topics = {};

            function createTopic() {
                var listeners = [];

                return {
                    listen: function (listener) {
                        listeners.push(listener);

                        return function unlisten() {
                            listeners = listeners.filter(function (l) {
                                return l !== listener;
                            });
                        };
                    },
                    notify: function (message) {
                        listeners.forEach(function (listener) {
                            try {
                                listener(message);
                            } catch (e) {
                                $log.error(ERROR_PREFIX + e.message);
                                $log.error(e);
                            }
                        });
                    }
                };
            }

            /**
             * Use and (if necessary) create a new topic.
             * @param {string} [key] name of the topic to use
             * @memberof platform/core.Topic#
             */
            return function (key) {
                if (arguments.length < 1) {
                    return createTopic();
                } else {
                    topics[key] = topics[key] || createTopic();

                    return topics[key];
                }
            };
        }

        return Topic;
    }
);

