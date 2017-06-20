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

define([],
    function () {
        /**
         * The EditNotesService is responsible for handling communication
         * between SaveAction and the EditNotesController as well as persisting
         * the notes when a SaveAction is called
         *
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditNotesService() {
        }

        /**
         * Keeps the EditNotesService in sync with the EditNotesController
         * @param (string) value passed in by the EditNotesController
         */
        EditNotesService.prototype.updateNotesFromController = function (value) {
            this.notes = value;
        };

        /**
         * Updates the notes property in a domain object model based on
         * a value given by the edit notes controller.
         * @param (DomainObject) The active domainObject that we want to
         *         mutate
         */
        EditNotesService.prototype.saveNotes = function (domainObject) {
            if (this.notes != null) {
                var type = domainObject.getCapability('type'),
                    properties = type.getProperties(),
                    notes = this.notes;

                function getNotesIndex() {
                    var notesIndex;
                    properties.forEach(function (property, index) {
                        if (property.getDefinition().key === 'notes') {
                            notesIndex = index;
                        }
                    });

                    return notesIndex;
                }

                var notesIndex = getNotesIndex();

                // Make sure the object has a notes property before mutation
                if (notesIndex != null)
                    return domainObject.useCapability('mutation', function (model) {
                        properties[notesIndex].setValue(model, notes);
                    });
            }
        };

        return EditNotesService;
    }
);
