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

define(["zepto"], function ($) {

    /**
     * The FileInputService provides an interface for triggering a file input.
     *
     * @constructor
     * @memberof platform/forms
     */
    function FileInputService() {
    }

    /**
     * Creates, triggers, and destroys a file picker element and returns a
     * promise for an object containing the chosen file's name and contents.
     *
     * @returns {Promise} promise for an object containing file meta-data
     */
    FileInputService.prototype.getInput = function (fileType) {
        var input = this.newInput();
        var read = this.readFile;
        var fileInfo = {};
        var file;

        return new Promise(function (resolve, reject) {
            input.trigger("click");
            input.on('change', function (event) {
                // eslint-disable-next-line no-invalid-this
                file = this.files[0];
                input.remove();
                if (file) {
                    if (fileType && (!file.type || (file.type !== fileType))) {
                        reject("Incompatible file type");
                    }

                    read(file)
                        .then(function (contents) {
                            fileInfo.name = file.name;
                            fileInfo.body = contents;
                            resolve(fileInfo);
                        }, function () {
                            reject("File read error");
                        });
                }
            });
        });
    };

    FileInputService.prototype.readFile = function (file) {
        var fileReader = new FileReader();

        return new Promise(function (resolve, reject) {
            fileReader.onload = function (event) {
                resolve(event.target.result);
            };

            fileReader.onerror = function () {
                return reject(event.target.result);
            };

            fileReader.readAsText(file);
        });
    };

    FileInputService.prototype.newInput = function () {
        var input = $(document.createElement('input'));
        input.attr("type", "file");
        input.css("display", "none");
        $('body').append(input);

        return input;
    };

    return FileInputService;
});
