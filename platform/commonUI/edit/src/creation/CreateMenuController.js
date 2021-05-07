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
 * Module defining CreateMenuController. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {

        /**
         * Controller for the Create menu; maintains an up-to-date
         * set of Create actions based on the currently-selected
         * domain object.
         *
         * @memberof platform/commonUI/browse
         * @constructor
         */
        function CreateMenuController($scope) {
            // Update the set of Create actions
            function refreshActions() {
                $scope.createActions = $scope.action
                    ? $scope.action.getActions('create')
                    : [];
            }

            // Listen for new instances of the represented object's
            // "action" capability. This is provided by the mct-representation
            // for the Create button.
            // A watch is needed here (instead of invoking action.getActions
            // directly) because different action instances may be returned
            // with each call.
            $scope.$watch("action", refreshActions);
        }

        return CreateMenuController;
    }
);
