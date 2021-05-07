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
 * ContextCapability. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/ContextCapability"],
    function (ContextCapability) {

        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("The context capability", function () {
            var mockDomainObject,
                mockParent,
                mockGrandparent,
                mockContext,
                context;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockParent = jasmine.createSpyObj("parent", DOMAIN_OBJECT_METHODS);
                mockGrandparent = jasmine.createSpyObj("grandparent", DOMAIN_OBJECT_METHODS);
                mockContext = jasmine.createSpyObj("context", ["getParent", "getRoot", "getPath"]);

                mockParent.getCapability.and.returnValue(mockContext);
                mockContext.getParent.and.returnValue(mockGrandparent);
                mockContext.getRoot.and.returnValue(mockGrandparent);
                mockContext.getPath.and.returnValue([mockGrandparent, mockParent]);

                context = new ContextCapability(mockParent, mockDomainObject);
            });

            it("allows an object's parent to be retrieved", function () {
                expect(context.getParent()).toEqual(mockParent);
            });

            it("allows an object's full ancestry to be retrieved", function () {
                expect(context.getPath()).toEqual([mockGrandparent, mockParent, mockDomainObject]);
            });

            it("allows the deepest ancestor of an object to be retrieved", function () {
                expect(context.getRoot()).toEqual(mockGrandparent);
            });

            it("treats ancestors with no context capability as deepest ancestors", function () {
                mockParent.getCapability.and.returnValue(undefined);
                expect(context.getPath()).toEqual([mockParent, mockDomainObject]);
                expect(context.getRoot()).toEqual(mockParent);
            });

        });
    }
);
