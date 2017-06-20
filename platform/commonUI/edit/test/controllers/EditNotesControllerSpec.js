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
    ["../../src/controllers/EditNotesController"],
    function (EditNotesController) {
        describe("The Edit Notes controller", function () {
            var mockScope,
                mockDomainObject,
                mockEditNotesService,
                controller;

            // Utility function; look for a $watch on scope and fire it
            function fireWatch(expr, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$watch"]
                );

                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["useCapability"]
                );

                mockEditNotesService = jasmine.createSpyObj(
                    "editNotesService",
                    ["updateNotesFromController"]
                );

                mockScope.domainObject = mockDomainObject;
                mockDomainObject.useCapability.andReturn([{
                    name: "Notes",
                    value: "Initial Notes"
                }]);

                controller = new EditNotesController(
                    mockScope,
                    mockEditNotesService
                );
            });

            it("keeps the edit notes service updated on the user input", function () {
                var newNotes = "Updated Notes";
                mockScope.notes = newNotes;
                fireWatch("notes", newNotes);
                expect(mockEditNotesService.updateNotesFromController).toHaveBeenCalledWith(newNotes);
            });

        });
    }
);
