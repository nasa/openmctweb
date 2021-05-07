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
    ["../src/FileInputService"],
    function (FileInputService) {

        describe("The FileInputService", function () {
            var fileInputService,
                mockInput;

            beforeEach(function () {
                fileInputService = new FileInputService();
                mockInput = jasmine.createSpyObj('input',
                    [
                        'on',
                        'trigger',
                        'remove'
                    ]
                );
                mockInput.on.and.callFake(function (event, changeHandler) {
                    changeHandler.apply(mockInput);
                });
                spyOn(fileInputService, "newInput").and.returnValue(
                    mockInput
                );

            });

            it("can read a file", function () {
                mockInput.files = [new File(["file content"], "file name")];
                fileInputService.getInput().then(function (result) {
                    expect(result.name).toBe("file name");
                    expect(result.body).toBe("file content");
                });

                expect(mockInput.trigger).toHaveBeenCalledWith('click');
                expect(mockInput.remove).toHaveBeenCalled();
            });

            it("catches file read errors", function () {
                mockInput.files = ["GARBAGE"];
                fileInputService.getInput().then(
                    function (result) {},
                    function (err) {
                        expect(err).toBe("File read error");
                    }
                );

                expect(mockInput.trigger).toHaveBeenCalledWith('click');
                expect(mockInput.remove).toHaveBeenCalled();
            });
        });
    }
);
