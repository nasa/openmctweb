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
    ["../../src/services/Topic"],
    function (Topic) {

        describe("The 'topic' service", function () {
            var topic,
                mockLog,
                testMessage,
                mockCallback;

            beforeEach(function () {
                testMessage = { someKey: "some value"};
                mockLog = jasmine.createSpyObj(
                    '$log',
                    ['error', 'warn', 'info', 'debug']
                );
                mockCallback = jasmine.createSpy('callback');
                topic = new Topic(mockLog);
            });

            it("notifies listeners on a topic", function () {
                topic("abc").listen(mockCallback);
                topic("abc").notify(testMessage);
                expect(mockCallback).toHaveBeenCalledWith(testMessage);
            });

            it("does not notify listeners across topics", function () {
                topic("abc").listen(mockCallback);
                topic("xyz").notify(testMessage);
                expect(mockCallback).not.toHaveBeenCalledWith(testMessage);
            });

            it("does not notify listeners after unlistening", function () {
                topic("abc").listen(mockCallback)(); // Unlisten immediately
                topic("abc").notify(testMessage);
                expect(mockCallback).not.toHaveBeenCalledWith(testMessage);
            });

            it("provides anonymous private topics", function () {
                var t1 = topic(), t2 = topic();

                t1.listen(mockCallback);
                t2.notify(testMessage);
                expect(mockCallback).not.toHaveBeenCalledWith(testMessage);
                t1.notify(testMessage);
                expect(mockCallback).toHaveBeenCalledWith(testMessage);
            });

            it("is robust against errors thrown by listeners", function () {
                var mockBadCallback = jasmine.createSpy("bad-callback"),
                    t = topic();

                mockBadCallback.and.callFake(function () {
                    throw new Error("I'm afraid I can't do that.");
                });

                t.listen(mockBadCallback);
                t.listen(mockCallback);

                t.notify(testMessage);
                expect(mockCallback).toHaveBeenCalledWith(testMessage);
            });

        });
    }
);
