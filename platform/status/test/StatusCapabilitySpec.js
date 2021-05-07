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
    ["../src/StatusCapability"],
    function (StatusCapability) {

        describe("The status capability", function () {
            var mockStatusService,
                mockDomainObject,
                mockUnlisten,
                testId,
                testStatusFlags,
                capability;

            beforeEach(function () {
                testId = "some-id";
                testStatusFlags = ['a', 'b', 'c'];

                mockStatusService = jasmine.createSpyObj(
                    'statusService',
                    ['listen', 'setStatus', 'listStatuses']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability', 'getModel']
                );
                mockUnlisten = jasmine.createSpy('unlisten');

                mockStatusService.listen.and.returnValue(mockUnlisten);
                mockStatusService.listStatuses.and.returnValue(testStatusFlags);
                mockDomainObject.getId.and.returnValue(testId);

                capability = new StatusCapability(
                    mockStatusService,
                    mockDomainObject
                );
            });

            it("sets status with the statusService", function () {
                var testStatus = "some-test-status";
                capability.set(testStatus, true);
                expect(mockStatusService.setStatus)
                    .toHaveBeenCalledWith(testId, testStatus, true);
                capability.set(testStatus, false);
                expect(mockStatusService.setStatus)
                    .toHaveBeenCalledWith(testId, testStatus, false);
            });

            it("gets status from the statusService", function () {
                expect(capability.list()).toBe(testStatusFlags);
            });

            it("listens to changes from the statusService", function () {
                var mockCallback = jasmine.createSpy();
                expect(capability.listen(mockCallback))
                    .toBe(mockUnlisten);
                expect(mockStatusService.listen)
                    .toHaveBeenCalledWith(testId, mockCallback);
            });

            it("allows statuses to be checked individually", function () {
                expect(capability.get('some-unset-status')).toBe(false);
                expect(capability.get(testStatusFlags[0])).toBe(true);
            });
        });
    }
);
