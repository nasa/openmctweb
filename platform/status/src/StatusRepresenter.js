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
    ['./StatusConstants'],
    function (StatusConstants) {

        var STATUS_CLASS_PREFIX = StatusConstants.CSS_CLASS_PREFIX;

        /**
         * Adds/removes CSS classes to `mct-representation`s to reflect the
         * current status of represented domain objects, as reported by
         * their `status` capability.
         *
         * Statuses are prefixed with `s-status-` to build CSS class names.
         * As such, when a domain object has the status "pending", its
         * representations will have the CSS class `s-status-pending`.
         *
         * @param {angular.Scope} scope the representation's scope object
         * @param element the representation's jqLite-wrapped DOM element
         * @implements {Representer}
         * @constructor
         * @memberof platform/status
         */
        function StatusRepresenter(scope, element) {
            this.element = element;
            this.lastClasses = [];
        }

        /**
         * Remove any status-related classes from this representation.
         * @private
         */
        StatusRepresenter.prototype.clearClasses = function () {
            var element = this.element;
            this.lastClasses.forEach(function (c) {
                element.removeClass(c);
            });
        };

        StatusRepresenter.prototype.represent = function (representation, domainObject) {
            var self = this,
                statusCapability = domainObject.getCapability('status');

            function updateStatus(flags) {
                var newClasses = flags.map(function (flag) {
                    return STATUS_CLASS_PREFIX + flag;
                });

                self.clearClasses();

                newClasses.forEach(function (c) {
                    self.element.addClass(c);
                });

                self.lastClasses = newClasses;
            }

            updateStatus(statusCapability.list());
            this.unlisten = statusCapability.listen(updateStatus);
        };

        StatusRepresenter.prototype.destroy = function () {
            this.clearClasses();
            if (this.unlisten) {
                this.unlisten();
                this.unlisten = undefined;
            }
        };

        return StatusRepresenter;

    }
);
