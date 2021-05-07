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
 * DelegationCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/DelegationCapability"],
    function (DelegationCapability) {

        describe("The delegation capability", function () {
            var captured,
                typeDef = {},
                type,
                capabilities,
                children = [],
                object = {},
                delegation;

            function capture(k) {
                return function (v) {
                    captured[k] = v;
                };
            }

            function TestDomainObject(caps, id) {
                return {
                    getId: function () {
                        return id;
                    },
                    getCapability: function (name) {
                        return caps[name];
                    },
                    useCapability: function (name) {
                        return this.getCapability(name).invoke();
                    },
                    hasCapability: function (name) {
                        return this.getCapability(name) !== undefined;
                    }
                };
            }

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return value.then
                            ? value : mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                captured = {};
                typeDef = {};
                typeDef.delegates = ["foo"];
                type = {
                    getDefinition: function () {
                        return typeDef;
                    }
                };
                children = [];
                capabilities = {
                    type: type,
                    composition: {
                        invoke: function () {
                            return mockPromise(children);
                        }
                    }
                };
                object = new TestDomainObject(capabilities);

                delegation = new DelegationCapability({ when: mockPromise }, object);
            });

            it("provides a list of children which expose a desired capability", function () {

                children = [
                    new TestDomainObject({ foo: true }, 'has-capability'),
                    new TestDomainObject({ }, 'does-not-have-capability')
                ];

                // Look up delegates
                delegation.getDelegates('foo').then(capture('delegates'));

                // Expect only the first child to be a delegate
                expect(captured.delegates.length).toEqual(1);
                expect(captured.delegates[0].getId()).toEqual('has-capability');
            });
        });
    }
);
