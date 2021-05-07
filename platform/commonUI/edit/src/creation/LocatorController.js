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
         * Controller for the "locator" control, which provides the
         * user with the ability to select a domain object as the
         * destination for a newly-created object in the Create menu.
         * @memberof platform/commonUI/browse
         * @constructor
         */
        function LocatorController($scope, $timeout, objectService) {
            // Populate values needed by the locator control. These are:
            // * rootObject: The top-level object, since we want to show
            //               the full tree
            // * treeModel: The model for the embedded tree representation,
            //              used for bi-directional object selection.
            function setLocatingObject(domainObject, priorObject) {
                var context = domainObject
                    && domainObject.getCapability("context"),
                    contextRoot = context && context.getRoot();

                if (contextRoot && contextRoot !== $scope.rootObject) {
                    $scope.rootObject = undefined;
                    // Update the displayed tree on a timeout to avoid
                    // an infinite digest exception.
                    $timeout(function () {
                        $scope.rootObject =
                            (context && context.getRoot()) || $scope.rootObject;
                    }, 0);
                } else if (!contextRoot && !$scope.rootObject) {
                    // Update the displayed tree on a timeout to avoid
                    // an infinite digest exception.
                    objectService.getObjects(['ROOT'])
                        .then(function (objects) {
                            $timeout(function () {
                                $scope.rootObject = objects.ROOT;
                            }, 0);
                        });
                }

                $scope.treeModel.selectedObject = domainObject;
                $scope.ngModel[$scope.field] = domainObject;

                // Restrict which locations can be selected
                if (domainObject
                        && $scope.structure
                            && $scope.structure.validate) {
                    if (!$scope.structure.validate(domainObject)) {
                        setLocatingObject(priorObject, undefined);

                        return;
                    }
                }

                // Set validity
                if ($scope.ngModelController) {
                    $scope.ngModelController.$setValidity(
                        'composition',
                        Boolean($scope.treeModel.selectedObject)
                    );
                }
            }

            // Initial state for the tree's model
            $scope.treeModel =
                { selectedObject: $scope.ngModel[$scope.field] };

            // Watch for changes from the tree
            $scope.$watch("treeModel.selectedObject", setLocatingObject);
        }

        return LocatorController;
    }
);

