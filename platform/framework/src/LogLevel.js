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

        // Log levels; note that these must be in order of
        // most-important-first for LogLevel to function correctly
        // as implemented.
        var LOG_LEVELS = [
            'error',
            'warn',
            'info',
            'log',
            'debug'
        ];

        // No-op, to replace undesired log levels with
        function NOOP() {}

        /**
         * Handles enforcement of logging at different levels, specified
         * at load time. The provided level should be one of "error",
         * "warn", "info", "log", or "debug"; otherwise, "warn" is used
         * as a default. Only log messages of levels equal to or greater
         * than the specified level will be passed to console.
         *
         * @memberof platform/framework
         * @constructor
         * @param {string} level the logging level
         */
        function LogLevel(level) {
            // Find the numeric level associated with the string
            this.index = LOG_LEVELS.indexOf(level);

            // Default to 'warn' level if unspecified
            if (this.index < 0) {
                this.index = 1;
            }
        }

        /**
         * Configure logging to suppress log output if it is
         * not of an appropriate level. Both the Angular app
         * being initialized and a reference to `$log` should be
         * passed; the former is used to configure application
         * logging, while the latter is needed to apply the
         * same configuration during framework initialization
         * (since the framework also logs.)
         *
         * @param app the Angular app to configure
         * @param $log Angular's $log (also configured)
         * @memberof platform/framework.LogLevel#
         */
        LogLevel.prototype.configure = function (app, $log) {
            var index = this.index;

            // Replace logging methods with no-ops, if they are
            // not of an appropriate level.
            function decorate(log) {
                LOG_LEVELS.forEach(function (m, i) {
                    // Determine applicability based on index
                    // (since levels are in descending order)
                    if (i > index) {
                        log[m] = NOOP;
                    }
                });
            }

            decorate($log);
            app.decorator('$log', ['$delegate', function ($delegate) {
                decorate($delegate);

                return $delegate;
            }]);
        };

        return LogLevel;
    }
);
