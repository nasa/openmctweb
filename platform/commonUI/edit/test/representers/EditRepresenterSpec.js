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

define([
    '../../src/representers/EditRepresenter'
], function (
    EditRepresenter
) {
    describe('EditRepresenter', function () {
        var $log,
            $scope,
            representer;

        beforeEach(function () {
            $log = jasmine.createSpyObj('$log', ['debug']);
            $scope = {};
            representer = new EditRepresenter($log, $scope);
        });

        it('injects a commit function in scope', function () {
            expect($scope.commit).toEqual(jasmine.any(Function));
        });

        describe('representation', function () {
            var domainObject,
                representation;

            beforeEach(function () {
                domainObject = jasmine.createSpyObj('domainObject', [
                    'getId',
                    'getModel',
                    'useCapability'
                ]);

                domainObject.getId.and.returnValue('anId');
                domainObject.getModel.and.returnValue({name: 'anObject'});

                representation = {
                    key: 'someRepresentation'
                };
                $scope.model = {name: 'anotherName'};
                $scope.configuration = {some: 'config'};
                representer.represent(representation, domainObject);
            });

            it('logs a message when commiting', function () {
                $scope.commit('Test Message');
                expect($log.debug)
                    .toHaveBeenCalledWith('Committing  anObject (anId): Test Message');
            });

            it('mutates the object when committing', function () {
                $scope.commit('Test Message');

                expect(domainObject.useCapability)
                    .toHaveBeenCalledWith('mutation', jasmine.any(Function));

                var mutateValue = domainObject.useCapability.calls.all()[0].args[1]();

                expect(mutateValue.configuration.someRepresentation)
                    .toEqual({some: 'config'});
                expect(mutateValue.name).toEqual('anotherName');
            });

        });

    });
});
