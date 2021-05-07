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

        /**
         * LinkService provides an interface for linking objects to additional
         * locations.  It also provides a method for determining if an object
         * can be copied to a specific location.
         * @constructor
         * @memberof platform/entanglement
         * @implements {platform/entanglement.AbstractComposeService}
         */
        function LinkService(openmct) {
            this.openmct = openmct;
        }

        LinkService.prototype.validate = function (object, parentCandidate) {
            if (!parentCandidate || !parentCandidate.getId) {
                return false;
            }

            if (parentCandidate.getId() === object.getId()) {
                return false;
            }

            if (!parentCandidate.hasCapability('composition')) {
                return false;
            }

            if (parentCandidate.getModel().composition.indexOf(object.getId()) !== -1) {
                return false;
            }

            return this.openmct.composition.checkPolicy(parentCandidate.useCapability('adapter'), object.useCapability('adapter'));
        };

        LinkService.prototype.perform = function (object, parentObject) {
            if (!this.validate(object, parentObject)) {
                throw new Error(
                    "Tried to link objects without validating first."
                );
            }

            return parentObject.getCapability('composition').add(object);
        };

        return LinkService;
    }
);

