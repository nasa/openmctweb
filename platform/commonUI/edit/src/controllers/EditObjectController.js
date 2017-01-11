/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
 * This bundle implements Edit mode.
 * @namespace platform/commonUI/edit
 */
define(
    [],
    () => {

        const isDirty = (domainObject) => {
            let navigatedObject = domainObject,
                editorCapability = navigatedObject &&
                    navigatedObject.getCapability("editor");

            return editorCapability &&
                editorCapability.isEditContextRoot() &&
                editorCapability.dirty();
        };

        const cancelEditing = (domainObject) => {
            let navigatedObject = domainObject,
                editorCapability = navigatedObject &&
                    navigatedObject.getCapability("editor");

            return editorCapability &&
                editorCapability.finish();
        };

        /**
         * Controller which is responsible for populating the scope for
         * Edit mode
         * @memberof platform/commonUI/edit
         * @constructor
         */
        const EditObjectController = ($scope, $location, navigationService) => {
            this.scope = $scope;
            let domainObject = $scope.domainObject;

            let removeCheck = navigationService
                .checkBeforeNavigation( () => {
                    if (isDirty(domainObject)) {
                        return "Continuing will cause the loss of any unsaved changes.";
                    }
                    return false;
                });

            $scope.$on('$destroy', () => {
                removeCheck();
                cancelEditing(domainObject);
            });

            const setViewForDomainObject = () => {

                let locationViewKey = $location.search().view;

                const selectViewIfMatching = (view) => {
                    if (view.key === locationViewKey) {
                        $scope.representation = $scope.representation || {};
                        $scope.representation.selected = view;
                    }
                };

                if (locationViewKey) {
                    ((domainObject && domainObject.useCapability('view')) || [])
                        .forEach(selectViewIfMatching);
                }
            }

            setViewForDomainObject();

            $scope.doAction = (action) => {
                return $scope[action] && $scope[action]();
            };
        }

        return EditObjectController;
    }
);
