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
    [],
    function () {
        "use strict";

        function ExampleFormController($scope) {
            $scope.state = {

            };

            $scope.toolbar = {
                name: "An example toolbar.",
                sections: [
                    {
                        description: "First section",
                        items: [
                            {
                                name: "X",
                                description: "X coordinate",
                                control: "textfield",
                                pattern: "^\\d+$",
                                disabled: true,
                                size: 2,
                                key: "x"
                            },
                            {
                                name: "Y",
                                description: "Y coordinate",
                                control: "textfield",
                                pattern: "^\\d+$",
                                size: 2,
                                key: "y"
                            },
                            {
                                name: "W",
                                description: "Cell width",
                                control: "textfield",
                                pattern: "^\\d+$",
                                size: 2,
                                key: "w"
                            },
                            {
                                name: "H",
                                description: "Cell height",
                                control: "textfield",
                                pattern: "^\\d+$",
                                size: 2,
                                key: "h"
                            }

                        ]
                    },
                    {
                        description: "Second section",
                        items: [
                            {
                                control: "button",
                                csslass: "icon-save",
                                click: function () {
                                    console.log("Save");
                                }
                            },
                            {
                                control: "button",
                                csslass: "icon-x",
                                description: "Button B",
                                click: function () {
                                    console.log("Cancel");
                                }
                            },
                            {
                                control: "button",
                                csslass: "icon-trash",
                                description: "Button C",
                                disabled: true,
                                click: function () {
                                    console.log("Delete");
                                }
                            }
                        ]
                    },
                    {
                        items: [
                            {
                                control: "color",
                                key: "color"
                            }
                        ]
                    }
                ]
            };

            $scope.form = {
                name: "An example form.",
                sections: [
                    {
                        name: "First section",
                        rows: [
                            {
                                name: "Check me",
                                control: "checkbox",
                                key: "checkMe"
                            },
                            {
                                name: "Enter your name",
                                required: true,
                                control: "textfield",
                                key: "yourName"
                            },
                            {
                                name: "Enter a number",
                                control: "textfield",
                                pattern: "^\\d+$",
                                key: "aNumber"
                            }
                        ]
                    },
                    {
                        name: "Second section",
                        rows: [
                            {
                                name: "Pick a date",
                                required: true,
                                description: "Enter date in form YYYY-DDD",
                                control: "datetime",
                                key: "aDate"
                            },
                            {
                                name: "Choose something",
                                control: "select",
                                options: [
                                    {
                                        name: "Hats",
                                        value: "hats"
                                    },
                                    {
                                        name: "Bats",
                                        value: "bats"
                                    },
                                    {
                                        name: "Cats",
                                        value: "cats"
                                    },
                                    {
                                        name: "Mats",
                                        value: "mats"
                                    }
                                ],
                                key: "aChoice"
                            },
                            {
                                name: "Choose something",
                                control: "select",
                                required: true,
                                options: [
                                    {
                                        name: "Hats",
                                        value: "hats"
                                    },
                                    {
                                        name: "Bats",
                                        value: "bats"
                                    },
                                    {
                                        name: "Cats",
                                        value: "cats"
                                    },
                                    {
                                        name: "Mats",
                                        value: "mats"
                                    }
                                ],
                                key: "aRequiredChoice"
                            }
                        ]
                    }
                ]
            };
        }

        return ExampleFormController;
    }
);
