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
 * Module defining EditActionController. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {

        var SAVE_ACTION_CONTEXT = { category: 'save' };
        var OTHERS_ACTION_CONTEXT = { category: 'conclude-editing' };

        /**
         * Controller which supplies action instances for Save/Cancel.
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditActionController($scope) {

            function actionToMenuOption(action) {
                return {
                    key: action,
                    name: action.getMetadata().name,
                    cssClass: action.getMetadata().cssClass
                };
            }

            // Maintain all "conclude-editing" and "save" actions in the
            // present context.
            function updateActions() {
                $scope.saveActions = $scope.action
                    ? $scope.action.getActions(SAVE_ACTION_CONTEXT)
                    : [];

                $scope.saveActionsAsMenuOptions = $scope.saveActions.map(actionToMenuOption);

                $scope.saveActionMenuClickHandler = function (clickedAction) {
                    clickedAction.perform();
                };

                $scope.otherEditActions = $scope.action
                    ? $scope.action.getActions(OTHERS_ACTION_CONTEXT)
                    : [];

                // Required because Angular does not allow 'bind'
                // in expressions.
                $scope.actionPerformer = function (action) {
                    return action.perform.bind(action);
                };
            }

            // Update set of actions whenever the action capability
            // changes or becomes available.
            $scope.$watch("action", updateActions);
        }

        return EditActionController;
    }
);
