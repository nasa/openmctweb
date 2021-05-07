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
 * CompositionCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/RelationshipCapability"],
    function (RelationshipCapability) {

        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("The relationship capability", function () {
            var mockDomainObject,
                mockInjector,
                mockObjectService,
                relationship;

            // Composition Capability makes use of promise chaining,
            // so support that, but don't introduce complication of
            // native promises.
            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    DOMAIN_OBJECT_METHODS
                );

                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    ["getObjects"]
                );

                mockInjector = {
                    get: function (name) {
                        return (name === "objectService") && mockObjectService;
                    }
                };

                mockObjectService.getObjects.and.returnValue(mockPromise([]));

                relationship = new RelationshipCapability(
                    mockInjector,
                    mockDomainObject
                );
            });

            it("applies only to models with a 'relationships' field", function () {
                expect(RelationshipCapability.appliesTo({ relationships: {} }))
                    .toBeTruthy();
                expect(RelationshipCapability.appliesTo({}))
                    .toBeFalsy();
            });

            it("requests ids found in model's composition from the object service", function () {
                var ids = ["a", "b", "c", "xyz"];

                mockDomainObject.getModel.and.returnValue({ relationships: { xyz: ids } });

                relationship.getRelatedObjects('xyz');

                expect(mockObjectService.getObjects).toHaveBeenCalledWith(ids);
            });

            it("provides a list of relationship types", function () {
                mockDomainObject.getModel.and.returnValue({
                    relationships: {
                        abc: ['a', 'b'],
                        def: "not an array, should be ignored",
                        xyz: []
                    }
                });
                expect(relationship.listRelationships()).toEqual(['abc', 'xyz']);
            });

            it("avoids redundant requests", function () {
                // Lookups can be expensive, so this capability
                // should have some self-caching
                mockDomainObject.getModel
                    .and.returnValue({ relationships: { xyz: ['a'] } });

                // Call twice; response should be the same object instance
                expect(relationship.getRelatedObjects('xyz'))
                    .toBe(relationship.getRelatedObjects('xyz'));

                // Should have only made one call
                expect(mockObjectService.getObjects.calls.count())
                    .toEqual(1);
            });

            it("makes new requests on modification", function () {
                // Lookups can be expensive, so this capability
                // should have some self-caching
                var testModel;

                testModel = { relationships: { xyz: ['a'] } };

                mockDomainObject.getModel.and.returnValue(testModel);

                // Call twice, but as if modification had occurred in between
                relationship.getRelatedObjects('xyz');
                testModel.modified = 123;
                relationship.getRelatedObjects('xyz');

                // Should have only made one call
                expect(mockObjectService.getObjects.calls.count())
                    .toEqual(2);
            });

        });
    }
);
