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
    ['../../src/gestures/InfoButtonGesture'],
    function (InfoButtonGesture) {

        describe("The info button gesture", function () {
            var mockDocument,
                mockBody,
                mockAgentService,
                mockInfoService,
                mockElement,
                mockDomainObject,
                mockEvent,
                mockScope,
                mockOff,
                testMetadata,
                mockHide,
                gesture,
                fireGesture,
                fireDismissGesture;

            beforeEach(function () {
                mockDocument = jasmine.createSpyObj('$document', ['find']);
                mockBody = jasmine.createSpyObj('body', ['on', 'off', 'scope', 'css', 'unbind']);
                mockDocument.find.and.returnValue(mockBody);
                mockAgentService = jasmine.createSpyObj('agentService', ['isMobile', 'isPhone']);
                mockInfoService = jasmine.createSpyObj(
                    'infoService',
                    ['display']
                );
                mockElement = jasmine.createSpyObj(
                    'element',
                    ['on', 'off', 'scope', 'css']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability', 'useCapability', 'getModel']
                );

                mockEvent = jasmine.createSpyObj("event", ["preventDefault", "stopPropagation"]);
                mockEvent.pageX = 0;
                mockEvent.pageY = 0;
                mockScope = jasmine.createSpyObj('$scope', ['$on']);
                mockOff = jasmine.createSpy('$off');
                testMetadata = [{
                    name: "Test name",
                    value: "Test value"
                }];
                mockHide = jasmine.createSpy('hide');

                mockDomainObject.getModel.and.returnValue({ name: "Test Object" });
                mockDomainObject.useCapability.and.callFake(function (c) {
                    return (c === 'metadata') ? testMetadata : undefined;
                });
                mockElement.scope.and.returnValue(mockScope);
                mockScope.$on.and.returnValue(mockOff);
                mockInfoService.display.and.returnValue(mockHide);
                mockAgentService.isMobile.and.returnValue(true);
                gesture = new InfoButtonGesture(
                    mockDocument,
                    mockAgentService,
                    mockInfoService,
                    mockElement,
                    mockDomainObject
                );
                fireGesture = mockElement.on.calls.mostRecent().args[1];
            });

            it("expect click on the representation", function () {
                // Fires a click call on element and then
                // expects the click to have happened
                fireGesture(mockEvent);
                expect(mockElement.on).toHaveBeenCalledWith(
                    "click",
                    jasmine.any(Function)
                );
            });

            it("expect click then dismiss on the representation", function () {
                // Fire the click and then expect the click
                fireGesture(mockEvent);
                expect(mockElement.on).toHaveBeenCalledWith(
                    "click",
                    jasmine.any(Function)
                );

                // Get the touch start on the body
                // and fire the dismiss gesture
                fireDismissGesture = mockBody.on.calls.mostRecent().args[1];
                fireDismissGesture(mockEvent);
                // Expect Body to have been touched, event.preventDefault()
                // to be called, then the mockBody listener to be detached
                // lastly unbind the touchstart used to dismiss so other
                // events can be called
                expect(mockBody.on).toHaveBeenCalledWith(
                    "touchstart",
                    jasmine.any(Function)
                );
                expect(mockEvent.preventDefault).toHaveBeenCalled();
                expect(mockBody.off).toHaveBeenCalledWith(
                    "touchstart",
                    jasmine.any(Function)
                );
                expect(mockBody.unbind).toHaveBeenCalledWith(
                    'touchstart'
                );
            });

            it("detaches a callback for info bubble events when destroyed", function () {
                expect(mockElement.off).not.toHaveBeenCalled();

                gesture.destroy();

                expect(mockElement.off).toHaveBeenCalledWith(
                    "click",
                    jasmine.any(Function)
                );
            });

            // https://github.com/nasa/openmct/issues/948
            it("does not try to access scope", function () {
                expect(mockElement.scope).not.toHaveBeenCalled();
            });

        });
    }
);
