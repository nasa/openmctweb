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

        var DISALLOWED_ACTIONS = ["move"];

        /**
         * This policy prevents performing move/copy/link actions across
         * different persistence spaces (e.g. linking to an object in
         * a private space from an object in a public space.)
         * @memberof {platform/entanglement}
         * @constructor
         * @implements {Policy}
         */
        function CrossSpacePolicy() {
        }

        function lookupSpace(domainObject) {
            var persistence = domainObject
                && domainObject.getCapability("persistence");

            return persistence && persistence.getSpace();
        }

        function isCrossSpace(context) {
            var domainObject = context.domainObject,
                selectedObject = context.selectedObject;

            return selectedObject !== undefined
                && domainObject !== undefined
                && lookupSpace(domainObject) !== lookupSpace(selectedObject);
        }

        CrossSpacePolicy.prototype.allow = function (action, context) {
            var key = action.getMetadata().key;

            if (DISALLOWED_ACTIONS.indexOf(key) !== -1) {
                return !isCrossSpace(context);
            }

            return true;
        };

        return CrossSpacePolicy;

    }
);
