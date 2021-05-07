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

        /**
         * A policy for determining whether a region part should be visible or
         * not, based on its editability and the current state of the domain
         * object .
         * @constructor
         * @implements {Policy}
         * @memberof platform/commonUI/regions
         */
        function EditableRegionPolicy() {
        }

        EditableRegionPolicy.prototype.allow = function (regionPart, domainObject) {
            if (!regionPart.modes) {
                return true;
            }

            if (domainObject.hasCapability('editor') && domainObject.getCapability('editor').inEditContext()) {
                //If the domain object is in edit mode, only include a part
                // if it is marked editable
                return regionPart.modes.indexOf('edit') !== -1;
            } else {
                //If the domain object is not in edit mode, return any parts
                // that are not explicitly marked editable
                return regionPart.modes.indexOf('browse') !== -1;
            }
        };

        return EditableRegionPolicy;
    }
);
