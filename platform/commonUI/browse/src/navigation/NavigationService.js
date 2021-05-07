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
 * Module defining NavigationService. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {

        /**
         * The navigation service maintains the application's current
         * navigation state, and allows listening for changes thereto.
         *
         * @memberof platform/commonUI/browse
         * @constructor
         */
        function NavigationService($window) {
            this.navigated = undefined;
            this.callbacks = [];
            this.checks = [];
            this.$window = $window;

            this.oldUnload = $window.onbeforeunload;
            $window.onbeforeunload = this.onBeforeUnload.bind(this);
        }

        /**
         * Get the current navigation state.
         *
         * @returns {DomainObject} the object that is navigated-to
         */
        NavigationService.prototype.getNavigation = function () {
            return this.navigated;
        };

        /**
         * Navigate to a specified object.  If navigation checks exist and
         * return reasons to prevent navigation, it will prompt the user before
         * continuing. Trying to navigate to the currently navigated object will
         * do nothing.
         *
         * If a truthy value is passed for `force`, it will skip navigation
         * and will not prevent navigation to an already selected object.
         *
         * @param {DomainObject} domainObject the domain object to navigate to
         * @param {Boolean} force if true, force navigation to occur.
         * @returns {Boolean} true if navigation occured, otherwise false.
         */
        NavigationService.prototype.setNavigation = function (domainObject, force) {
            if (force) {
                this.doNavigation(domainObject);

                return true;
            }

            if (this.navigated === domainObject) {
                return true;
            }

            var doNotNavigate = this.shouldWarnBeforeNavigate();
            if (doNotNavigate && !this.$window.confirm(doNotNavigate)) {
                return false;
            }

            this.doNavigation(domainObject);

            return true;
        };

        /**
         * Listen for changes in navigation. The passed callback will
         * be invoked with the new domain object of navigation when
         * this changes.
         *
         * @param {function} callback the callback to invoke when
         *        navigation state changes
         */
        NavigationService.prototype.addListener = function (callback) {
            this.callbacks.push(callback);
        };

        /**
         * Stop listening for changes in navigation state.
         *
         * @param {function} callback the callback which should
         *        no longer be invoked when navigation state
         *        changes
         */
        NavigationService.prototype.removeListener = function (callback) {
            this.callbacks = this.callbacks.filter(function (cb) {
                return cb !== callback;
            });
        };

        /**
         * Check if navigation should proceed.  May prompt a user for input
         * if any checkFns return messages.  Returns true if the user wishes to
         * navigate, otherwise false.  If using this prior to calling
         * `setNavigation`, you should call `setNavigation` with `force=true`
         * to prevent duplicate dialogs being displayed to the user.
         *
         * @returns {Boolean} true if the user wishes to navigate, otherwise false.
         */
        NavigationService.prototype.shouldNavigate = function () {
            var doNotNavigate = this.shouldWarnBeforeNavigate();

            return !doNotNavigate || this.$window.confirm(doNotNavigate);
        };

        /**
         * Register a check function to be called before any navigation occurs.
         * Check functions should return a human readable "message" if
         * there are any reasons to prevent navigation.  Otherwise, they should
         * return falsy.  Returns a function which can be called to remove the
         * check function.
         *
         * @param {Function} checkFn a function to call before navigation occurs.
         * @returns {Function} removeCheck call to remove check
         */
        NavigationService.prototype.checkBeforeNavigation = function (checkFn) {
            this.checks.push(checkFn);

            return function removeCheck() {
                this.checks = this.checks.filter(function (fn) {
                    return checkFn !== fn;
                });
            }.bind(this);
        };

        /**
         * Private method to actually perform navigation.
         *
         * @private
         */
        NavigationService.prototype.doNavigation = function (value) {
            this.navigated = value;
            this.callbacks.forEach(function (callback) {
                callback(value);
            });
        };

        /**
         * Returns either a false value, or a string that should be displayed
         * to the user before navigation is allowed.
         *
         * @private
         */
        NavigationService.prototype.shouldWarnBeforeNavigate = function () {
            var reasons = [];
            this.checks.forEach(function (checkFn) {
                var reason = checkFn();
                if (reason) {
                    reasons.push(reason);
                }
            });

            if (reasons.length) {
                return reasons.join('\n');
            }

            return false;
        };

        /**
         * Listener for window on before unload event-- will warn before
         * navigation is allowed.
         *
         * @private
         */
        NavigationService.prototype.onBeforeUnload = function () {
            var shouldWarnBeforeNavigate = this.shouldWarnBeforeNavigate();
            if (shouldWarnBeforeNavigate) {
                return shouldWarnBeforeNavigate;
            }

            if (this.oldUnload) {
                return this.oldUnload.apply(undefined, [].slice.apply(arguments));
            }
        };

        return NavigationService;
    }
);
