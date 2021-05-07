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
    function () {
        "use strict";

        var DEFAULT_IDENTITY = {
                key: "user",
                name: "Example User"
            },
            DIALOG_STRUCTURE = {
                name: "Identify Yourself",
                sections: [{
                    rows: [
                        {
                            name: "User ID",
                            control: "textfield",
                            key: "key",
                            required: true
                        },
                        {
                            name: "Human name",
                            control: "textfield",
                            key: "name",
                            required: true
                        }
                    ]
                }]
            };

        /**
         * Example implementation of an identity service. This prompts the
         * user to enter a name and user ID; in a more realistic
         * implementation, this would be read from a server, possibly
         * prompting for a user name and password (or similar) as
         * appropriate.
         *
         * @implements {IdentityService}
         * @memberof platform/identity
         */
        function ExampleIdentityProvider(dialogService, $q) {
            this.dialogService = dialogService;
            this.$q = $q;

            this.returnUser = this.returnUser.bind(this);
            this.returnUndefined = this.returnUndefined.bind(this);
        }

        ExampleIdentityProvider.prototype.getUser = function () {
            if (this.user) {
                return this.$q.when(this.user);
            } else {
                return this.dialogService.getUserInput(DIALOG_STRUCTURE, DEFAULT_IDENTITY)
                    .then(this.returnUser, this.returnUndefined);
            }
        };

        /**
         * @private
         */
        ExampleIdentityProvider.prototype.returnUser = function (user) {
            return this.user = user;
        };

        /**
         * @private
         */
        ExampleIdentityProvider.prototype.returnUndefined = function () {
            return undefined;
        };

        return ExampleIdentityProvider;
    }
);
