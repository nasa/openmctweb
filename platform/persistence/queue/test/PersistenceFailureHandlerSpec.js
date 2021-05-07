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
    ["../src/PersistenceFailureHandler", "../src/PersistenceFailureConstants"],
    function (PersistenceFailureHandler, Constants) {

        describe("The persistence failure handler", function () {
            var mockQ,
                mockDialogService,
                mockFailures,
                mockPromise,
                handler;

            function makeMockFailure(id, index) {
                var mockFailure = jasmine.createSpyObj(
                        'failure-' + id,
                        ['requeue']
                    ),
                    mockPersistence = jasmine.createSpyObj(
                        'persistence-' + id,
                        ['refresh', 'persist']
                    );
                mockFailure.domainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'useCapability', 'getModel']
                );
                mockFailure.domainObject.getCapability.and.callFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });
                mockFailure.domainObject.getModel.and.returnValue({
                    id: id,
                    modified: index
                });
                mockFailure.persistence = mockPersistence;
                mockFailure.id = id;
                mockFailure.error = { key: Constants.REVISION_ERROR_KEY };

                return mockFailure;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['all', 'when']);
                mockDialogService = jasmine.createSpyObj('dialogService', ['getUserChoice']);
                mockFailures = ['a', 'b', 'c'].map(makeMockFailure);
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockDialogService.getUserChoice.and.returnValue(mockPromise);
                mockQ.all.and.returnValue(mockPromise);
                mockPromise.then.and.returnValue(mockPromise);
                handler = new PersistenceFailureHandler(mockQ, mockDialogService);
            });

            it("discards on handle", function () {
                handler.handle(mockFailures);
                mockFailures.forEach(function (mockFailure) {
                    expect(mockFailure.persistence.refresh).toHaveBeenCalled();
                    expect(mockFailure.requeue).not.toHaveBeenCalled();
                    expect(mockFailure.domainObject.useCapability).not.toHaveBeenCalled();
                });
            });
        });
    }
);
