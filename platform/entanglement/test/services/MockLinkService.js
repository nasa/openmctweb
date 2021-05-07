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
    [
        '../ControlledPromise'
    ],
    function (ControlledPromise) {

        /**
         * MockLinkService provides the same interface as the linkService,
         * returning promises where it would normally do so.  At it's core,
         * it is a jasmine spy object, but it also tracks the promises it
         * returns and provides shortcut methods for resolving those promises
         * synchronously.
         *
         * Usage:
         *
         * ```javascript
         * var linkService = new MockLinkService();
         *
         * // validate is a standard jasmine spy.
         * linkService.validate.and.returnValue(true);
         * var isValid = linkService.validate(object, parentObject);
         * expect(isValid).toBe(true);
         *
         * // perform returns promises and tracks them.
         * var whenLinked = jasmine.createSpy('whenLinked');
         * linkService.perform(object, parentObject).then(whenLinked);
         * expect(whenLinked).not.toHaveBeenCalled();
         * linkService.perform.calls.mostRecent().promise.resolve('someArg');
         * expect(whenLinked).toHaveBeenCalledWith('someArg');
         * ```
         */
        function MockLinkService() {
            // track most recent call of a function,
            // perform automatically returns
            var mockLinkService = jasmine.createSpyObj(
                'MockLinkService',
                [
                    'validate',
                    'perform'
                ]
            );

            mockLinkService.perform.and.callFake(object => {
                var performPromise = new ControlledPromise();

                mockLinkService.perform.calls.mostRecent().promise = performPromise;
                mockLinkService.perform.calls.all()[mockLinkService.perform.calls.count() - 1].promise =
                    performPromise;

                return performPromise.then(function (overrideObject) {
                    if (overrideObject) {
                        return overrideObject;
                    }

                    return object;
                });
            });

            return mockLinkService;
        }

        return MockLinkService;
    }
);
