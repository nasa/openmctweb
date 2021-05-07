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
    ['zepto'],
    function ($) {

        /**
         * The mct-file-input handles behavior of the file input form control.
         * @constructor
         * @memberof platform/forms
         */
        function MCTFileInput(fileInputService) {

            function link(scope, element, attrs, control) {

                function setText(fileName) {
                    scope.structure.text = fileName.length > 20
                        ? fileName.substr(0, 20) + "..."
                        : fileName;
                }

                function handleClick() {
                    fileInputService.getInput(scope.structure.type).then(function (result) {
                        setText(result.name);
                        scope.ngModel[scope.field] = result;
                        control.$setValidity("file-input", true);
                    }, function () {
                        setText('Select File');
                        control.$setValidity("file-input", false);
                    });
                }

                control.$setValidity("file-input", false);
                element.on('click', handleClick);
            }

            return {
                restrict: "A",
                require: "^form",
                link: link
            };
        }

        return MCTFileInput;
    }
);
