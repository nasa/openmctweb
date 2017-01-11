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
    ['../../src/actions/PropertiesAction'],
    (PropertiesAction) => {

        describe("Properties action", () => {
            let capabilities, model, object, context, input, dialogService, action;

            const mockPromise = (value) => {
                return {
                    then: (callback) => {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach( () => {
                capabilities = {
                    type: {
                        getProperties: () => {
                            return [];
                        },
                        hasFeature: jasmine.createSpy('hasFeature')
                    },
                    mutation: jasmine.createSpy("mutation")
                };
                model = {};
                input = {};
                object = {
                    getId: () => {
                        return 'test-id';
                    },
                    getCapability: (k) => {
                        return capabilities[k];
                    },
                    getModel: () => {
                        return model;
                    },
                    useCapability: (k, v) => {
                        return capabilities[k](v);
                    },
                    hasCapability: () => {
                        return true;
                    }
                };
                context = { someKey: "some value", domainObject: object };
                dialogService = {
                    getUserInput: () => {
                        return mockPromise(input);
                    }
                };

                capabilities.type.hasFeature.andReturn(true);
                capabilities.mutation.andReturn(true);

                action = new PropertiesAction(dialogService, context);
            });

            it("mutates an object when performed", () => {
                action.perform();
                expect(capabilities.mutation).toHaveBeenCalled();
                capabilities.mutation.mostRecentCall.args[0]({});
            });

            it("does not muate object upon cancel", () => {
                input = undefined;
                action.perform();
                expect(capabilities.mutation).not.toHaveBeenCalled();
            });

            it("is only applicable when a domain object is in context", () => {
                expect(PropertiesAction.appliesTo(context)).toBeTruthy();
                expect(PropertiesAction.appliesTo({})).toBeFalsy();
                // Make sure it checked for creatability
                expect(capabilities.type.hasFeature).toHaveBeenCalledWith('creation');
            });
        });
    }
);
