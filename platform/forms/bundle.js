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

define([
    "./src/MCTForm",
    "./src/MCTControl",
    "./src/MCTFileInput",
    "./src/FileInputService",
    "./src/controllers/AutocompleteController",
    "./src/controllers/DateTimeController",
    "./src/controllers/CompositeController",
    "./src/controllers/ColorController",
    "./src/controllers/DialogButtonController",
    "./res/templates/controls/autocomplete.html",
    "./res/templates/controls/checkbox.html",
    "./res/templates/controls/datetime.html",
    "./res/templates/controls/select.html",
    "./res/templates/controls/textfield.html",
    "./res/templates/controls/numberfield.html",
    "./res/templates/controls/textarea.html",
    "./res/templates/controls/button.html",
    "./res/templates/controls/color.html",
    "./res/templates/controls/composite.html",
    "./res/templates/controls/menu-button.html",
    "./res/templates/controls/dialog.html",
    "./res/templates/controls/radio.html",
    "./res/templates/controls/file-input.html"
], function (
    MCTForm,
    MCTControl,
    MCTFileInput,
    FileInputService,
    AutocompleteController,
    DateTimeController,
    CompositeController,
    ColorController,
    DialogButtonController,
    autocompleteTemplate,
    checkboxTemplate,
    datetimeTemplate,
    selectTemplate,
    textfieldTemplate,
    numberfieldTemplate,
    textareaTemplate,
    buttonTemplate,
    colorTemplate,
    compositeTemplate,
    menuButtonTemplate,
    dialogTemplate,
    radioTemplate,
    fileInputTemplate
) {

    return {
        name: "platform/forms",
        definition: {
            "name": "MCT Forms",
            "description": "Form generator; includes directive and some controls.",
            "extensions": {
                "directives": [
                    {
                        "key": "mctForm",
                        "implementation": MCTForm
                    },
                    {
                        "key": "mctControl",
                        "implementation": MCTControl,
                        "depends": [
                            "templateLinker",
                            "controls[]"
                        ]
                    },
                    {
                        "key": "mctFileInput",
                        "implementation": MCTFileInput,
                        "depends": [
                            "fileInputService"
                        ]
                    }
                ],
                "controls": [
                    {
                        "key": "autocomplete",
                        "template": autocompleteTemplate
                    },
                    {
                        "key": "checkbox",
                        "template": checkboxTemplate
                    },
                    {
                        "key": "radio",
                        "template": radioTemplate
                    },
                    {
                        "key": "datetime",
                        "template": datetimeTemplate
                    },
                    {
                        "key": "select",
                        "template": selectTemplate
                    },
                    {
                        "key": "textfield",
                        "template": textfieldTemplate
                    },
                    {
                        "key": "numberfield",
                        "template": numberfieldTemplate
                    },
                    {
                        "key": "textarea",
                        "template": textareaTemplate
                    },
                    {
                        "key": "button",
                        "template": buttonTemplate
                    },
                    {
                        "key": "color",
                        "template": colorTemplate
                    },
                    {
                        "key": "composite",
                        "template": compositeTemplate
                    },
                    {
                        "key": "menu-button",
                        "template": menuButtonTemplate
                    },
                    {
                        "key": "dialog-button",
                        "template": dialogTemplate
                    },
                    {
                        "key": "file-input",
                        "template": fileInputTemplate
                    }
                ],
                "controllers": [
                    {
                        "key": "AutocompleteController",
                        "implementation": AutocompleteController,
                        "depends": [
                            "$scope",
                            "$element"
                        ]
                    },
                    {
                        "key": "DateTimeController",
                        "implementation": DateTimeController,
                        "depends": [
                            "$scope"
                        ]
                    },
                    {
                        "key": "CompositeController",
                        "implementation": CompositeController
                    },
                    {
                        "key": "ColorController",
                        "implementation": ColorController
                    },
                    {
                        "key": "DialogButtonController",
                        "implementation": DialogButtonController,
                        "depends": [
                            "$scope",
                            "dialogService"
                        ]
                    }
                ],
                "components": [
                    {
                        "provides": "fileInputService",
                        "type": "provider",
                        "implementation": FileInputService
                    }

                ]
            }
        }
    };
});
