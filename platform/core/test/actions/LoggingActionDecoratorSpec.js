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
 * LoggingActionDecoratorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/actions/LoggingActionDecorator"],
    function (LoggingActionDecorator) {

        describe("The logging action decorator", function () {
            var mockLog,
                mockAction,
                mockActionService,
                decorator;

            beforeEach(function () {
                mockAction = jasmine.createSpyObj(
                    "action",
                    ["perform", "getMetadata"]
                );
                mockActionService = jasmine.createSpyObj(
                    "actionService",
                    ["getActions"]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );

                mockActionService.getActions.and.returnValue([mockAction]);

                decorator = new LoggingActionDecorator(
                    mockLog,
                    mockActionService
                );
            });

            it("logs when actions are performed", function () {
                // Verify precondition
                expect(mockLog.info).not.toHaveBeenCalled();

                // Perform an action, retrieved through the decorator
                decorator.getActions()[0].perform();

                // That should have been logged.
                expect(mockLog.info).toHaveBeenCalled();
            });

        });
    }
);
