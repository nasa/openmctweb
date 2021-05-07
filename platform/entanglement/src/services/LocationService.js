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

/**
 * This bundle implements actions which control the location of objects
 * (move, copy, link.)
 * @namespace platform/entanglement
 */
define(
    function () {

        /**
         * The LocationService allows for easily prompting the user for a
         * location in the root tree.
         * @constructor
         * @memberof platform/entanglement
         */
        function LocationService(dialogService) {
            return {
                /** Prompt the user to select a location.  Returns a promise
                 * that is resolved with a domainObject representing the
                 * location selected by the user.
                 *
                 * @param {string} title - title of location dialog
                 * @param {string} label - label for location input field
                 * @param {function} validate - function that validates
                 *     selections.
                 * @param {domainObject} initialLocation - tree location to
                 *     display at start
                 * @returns {Promise} promise for a domain object.
                 * @memberof platform/entanglement.LocationService#
                 */
                getLocationFromUser: function (title, label, validate, initialLocation) {
                    var formStructure,
                        formState;

                    formStructure = {
                        sections: [
                            {
                                name: 'Location',
                                cssClass: "grows",
                                rows: [
                                    {
                                        name: label,
                                        control: "locator",
                                        validate: validate,
                                        key: 'location'
                                    }
                                ]
                            }
                        ],
                        name: title
                    };

                    formState = {
                        location: initialLocation
                    };

                    return dialogService
                        .getUserInput(formStructure, formState)
                        .then(function (userFormState) {
                            return userFormState.location;
                        });
                }
            };
        }

        return LocationService;
    }
);

