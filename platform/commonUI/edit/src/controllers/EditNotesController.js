/**
 * Created by EvansDesktop on 2/15/2017.
 */
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

define(
    [],
    function () {

        /**
         * The EditNotesController prepares the edit-notes view for display
         * and keeps the editNotesService updated with user input.
         * @constructor
         */
        function EditNotesController($scope, editNotesService) {
            this.editNotesService = editNotesService;
            this.properties = $scope.domainObject.useCapability('metadata');

            function locateNotesValueInDomainObject(properties) {
                var notesValue;
                properties.forEach(function(property){
                    if (property.name === 'Notes'){
                        notesValue = property.value;
                    }
                });
                return notesValue;
            }

            function sendNotesToController(value){
                editNotesService.updateNotesFromController(value);
            }

            $scope.notes = locateNotesValueInDomainObject(this.properties);

            $scope.$watch('notes', sendNotesToController);
        }

        return EditNotesController;
    }
);
