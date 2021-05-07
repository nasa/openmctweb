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
    ["../src/StatusService"],
    function (StatusService) {

        describe("The status service", function () {
            var mockTopic,
                mockTopicInstance,
                mockUnlisten,
                mockCallback,
                testId,
                testStatus,
                statusService;

            beforeEach(function () {
                testId = "some-domain-object-identifier";
                testStatus = "test-status";

                mockTopic = jasmine.createSpy('topic');
                mockTopicInstance = jasmine.createSpyObj(
                    'topicInstance',
                    ['notify', 'listen']
                );
                mockUnlisten = jasmine.createSpy('unlisten');
                mockCallback = jasmine.createSpy('callback');

                mockTopic.and.returnValue(mockTopicInstance);
                mockTopicInstance.listen.and.returnValue(mockUnlisten);

                statusService = new StatusService(mockTopic);
            });

            it("initially contains no flags for an object", function () {
                expect(statusService.listStatuses(testId)).toEqual([]);
            });

            it("stores and clears status flags", function () {
                statusService.setStatus(testId, testStatus, true);
                expect(statusService.listStatuses(testId)).toEqual([testStatus]);
                statusService.setStatus(testId, testStatus, false);
                expect(statusService.listStatuses(testId)).toEqual([]);
            });

            it("uses topic to listen for changes", function () {
                expect(statusService.listen(testId, mockCallback))
                    .toEqual(mockUnlisten);
                expect(mockTopic)
                    .toHaveBeenCalledWith(jasmine.any(String));
                // Just care that the topic was somehow unique to the object
                expect(mockTopic.calls.mostRecent().args[0].indexOf(testId))
                    .not.toEqual(-1);
            });

            it("notifies listeners of changes", function () {
                statusService.setStatus(testId, testStatus, true);
                expect(mockTopicInstance.notify)
                    .toHaveBeenCalledWith([testStatus]);
                statusService.setStatus(testId, testStatus, false);
                expect(mockTopicInstance.notify)
                    .toHaveBeenCalledWith([]);

                expect(mockTopic)
                    .toHaveBeenCalledWith(jasmine.any(String));
                // Just care that the topic was somehow unique to the object
                expect(mockTopic.calls.mostRecent().args[0].indexOf(testId))
                    .not.toEqual(-1);
            });

        });
    }
);
