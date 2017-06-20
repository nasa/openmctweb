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
    ['../../src/services/EditNotesService'],
    function (EditNotesService) {
        describe("The Edit Notes Service", function () {
            var editNotesService,
                mockProperties,
                mockDomainObject,
                mockType;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [
                        'getCapability',
                        'useCapability'
                    ]
                );

                mockType = jasmine.createSpyObj(
                    'type',
                    ['getProperties']
                );

                mockDomainObject.getCapability.andReturn(mockType);
                editNotesService = new EditNotesService();
            });

            describe("With a valid domain object", function () {

                beforeEach(function() {
                    mockProperties = [
                        {key: "x", value: "xyz"},
                        {key: "y", value: "xyz"},
                        {key: "notes", value: "xyz"}
                    ].map(function (k) {
                            return {
                                getDefinition: function () {
                                    return k;
                                }
                            };
                        });

                    mockType.getProperties.andReturn(mockProperties);
                });

                it("mutates an object when saved", function () {
                    var updatedNotes = "updated notes";
                    editNotesService.updateNotesFromController(updatedNotes);
                    editNotesService.saveNotes(mockDomainObject);
                    expect(mockDomainObject.useCapability).toHaveBeenCalled();
                });
            });

            describe("With an invalid domain object", function () {
                beforeEach(function() {
                    mockProperties = [
                        {key: "x", value: "xyz"},
                        {key: "y", value: "xyz"}
                    ].map(function (k) {
                            return {
                                getDefinition: function () {
                                    return k.key;
                                }
                            };
                        });

                    mockType.getProperties.andReturn(mockProperties);
                });

                it("does not perform a mutation if the domainObject has no notes field", function () {
                    var updatedNotes = "updated notes";
                    editNotesService.updateNotesFromController(updatedNotes);
                    editNotesService.saveNotes(mockDomainObject);
                    expect(mockDomainObject.useCapability).not.toHaveBeenCalled();
                });
            });
        });
    });
