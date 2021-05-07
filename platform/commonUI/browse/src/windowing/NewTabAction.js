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
 * Module defining NewTabAction (Originally NewWindowAction). Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        /**
         * The new tab action allows a domain object to be opened
         * into a new browser tab.
         * @memberof platform/commonUI/browse
         * @constructor
         * @implements {Action}
         */
        function NewTabAction(urlService, $window, context) {
            context = context || {};

            this.urlService = urlService;
            this.open = function () {
                arguments[0] += "&hideTree=true&hideInspector=true";
                $window.open.apply($window, arguments);
            };

            // Choose the object to be opened into a new tab
            this.domainObject = context.selectedObject || context.domainObject;
        }

        NewTabAction.prototype.perform = function () {
            this.open(
                this.urlService.urlForNewTab("browse", this.domainObject),
                "_blank"
            );
        };

        return NewTabAction;
    }
);
