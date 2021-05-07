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
 * ContextualDomainObjectSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/ContextualDomainObject"],
    function (ContextualDomainObject) {

        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("A contextual domain object", function () {
            var mockParent,
                mockDomainObject,
                model,
                contextualDomainObject;

            beforeEach(function () {
                mockParent = jasmine.createSpyObj("parent", DOMAIN_OBJECT_METHODS);
                mockDomainObject = jasmine.createSpyObj("parent", DOMAIN_OBJECT_METHODS);

                model = { someKey: "some value" };

                mockDomainObject.getCapability.and.returnValue("some capability");
                mockDomainObject.getModel.and.returnValue(model);

                contextualDomainObject = new ContextualDomainObject(
                    mockDomainObject,
                    mockParent
                );
            });

            it("adds a context capability to a domain object", function () {
                var context = contextualDomainObject.getCapability('context');

                // Expect something that looks like a context capability
                expect(context).toBeDefined();
                expect(context.getPath).toBeDefined();
                expect(context.getRoot).toBeDefined();
                expect(context.getParent()).toEqual(mockParent);
            });

            it("does not shadow other domain object methods", function () {
                expect(contextualDomainObject.getModel())
                    .toEqual(model);
                expect(contextualDomainObject.getCapability("other"))
                    .toEqual("some capability");
            });

        });
    }
);
