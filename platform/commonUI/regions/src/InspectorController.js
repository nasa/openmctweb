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

        /**
         * The InspectorController listens for the selection changes and adds the selection
         * object to the scope.
         *
         * @constructor
         */
        function InspectorController($scope, openmct, $document) {
            var self = this;
            self.$scope = $scope;

            /**
             * Callback handler for the selection change event.
             * Adds the selection object to the scope. If the selected item has an inspector view,
             * it puts the key in the scope. If provider view exists, it shows the view.
             */
            function setSelection(selection) {
                if (selection[0]) {
                    var view = openmct.inspectorViews.get(selection);
                    var container = $document[0].querySelectorAll('.inspector-provider-view')[0];
                    container.innerHTML = "";

                    if (view) {
                        self.providerView = true;
                        view.show(container);
                    } else {
                        self.providerView = false;
                        var selectedItem = selection[0].context.oldItem;

                        if (selectedItem) {
                            $scope.inspectorKey = selectedItem.getCapability("type").typeDef.inspector;
                        }
                    }
                }

                self.$scope.selection = selection;
            }

            openmct.selection.on("change", setSelection);

            setSelection(openmct.selection.get());

            $scope.$on("$destroy", function () {
                openmct.selection.off("change", setSelection);
            });
        }

        /**
         * Gets the selected item.
         *
         * @returns a domain object
         */
        InspectorController.prototype.selectedItem = function () {
            return this.$scope.selection[0] && this.$scope.selection[0].context.oldItem;
        };

        /**
         * Checks if a provider view exists.
         *
         * @returns 'true' if provider view exists, 'false' otherwise
         */
        InspectorController.prototype.hasProviderView = function () {
            return this.providerView;
        };

        return InspectorController;
    }
);
