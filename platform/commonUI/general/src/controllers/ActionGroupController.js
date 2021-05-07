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
 * Module defining ActionGroupController. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {

        /**
         * Controller which keeps an up-to-date list of actions of
         * a certain category, and additionally bins them into
         * groups as described by their metadata. Used specifically
         * to support button groups.
         *
         * This will maintain two fields in the scope:
         * * `groups`: An array of arrays. Each element in the outer
         *   array corresponds to a group; the inner array contains
         *   the actions which are in that group.
         * * `ungrouped`: All actions which did not have a defined
         *   group.
         *
         * @memberof platform/commonUI/general
         * @constructor
         */
        function ActionGroupController($scope) {

            // Separate out the actions that have been retrieved
            // into groups, and populate scope with this.
            function groupActions(actions) {
                var groups = {},
                    ungrouped = [];

                function assignToGroup(action) {
                    var metadata = action.getMetadata(),
                        group = metadata.group;
                    if (group) {
                        groups[group] = groups[group] || [];
                        groups[group].push(action);
                    } else {
                        ungrouped.push(action);
                    }
                }

                (actions || []).forEach(assignToGroup);

                $scope.ungrouped = ungrouped;
                $scope.groups = Object.keys(groups).sort().map(function (k) {
                    return groups[k];
                });
            }

            // Callback for when state which might influence action groupings
            // changes.
            function updateGroups() {
                var actionCapability = $scope.action,
                    params = $scope.parameters || {},
                    category = params.category;

                if (actionCapability && category) {
                    // Get actions by capability, and group them
                    groupActions(actionCapability.getActions({
                        category: category
                    }));
                } else {
                    // We don't have enough information to get any actions.
                    groupActions([]);
                }
            }

            // Changes to the represented object, to its action capability, or
            // to the chosen action category may all require an update.
            $scope.$watch("domainObject", updateGroups);
            $scope.$watch("action", updateGroups);
            $scope.$watch("parameters.category", updateGroups);

            // Start with empty arrays.
            $scope.ungrouped = [];
            $scope.groups = [];
        }

        return ActionGroupController;
    }
);
