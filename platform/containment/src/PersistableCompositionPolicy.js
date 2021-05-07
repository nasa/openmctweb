/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
 * This bundle implements "containment" rules, which determine which objects
 * can be contained within which other objects.
 * @namespace platform/containment
 */
define(
    ['objectUtils'],
    function (objectUtils) {

        function PersistableCompositionPolicy(openmct) {
            this.openmct = openmct;
        }

        /**
         * Only allow changes to composition if the changes can be saved. This in
         * effect prevents selection of objects from the locator that do not
         * support persistence.
         * @param parent
         * @param child
         * @returns {boolean}
         */
        PersistableCompositionPolicy.prototype.allow = function (parent) {
            // If object is in edit mode, allow composition because it is
            // part of object creation, and the object may be saved to another
            // namespace that does support persistence. The EditPersistableObjectsPolicy
            // prevents editing of objects that cannot be persisted, so we can assume that this
            // is a new object.
            if (!(parent.hasCapability('editor') && parent.getCapability('editor').isEditContextRoot())) {
                let identifier = this.openmct.objects.parseKeyString(parent.getId());

                return this.openmct.objects.isPersistable(identifier);
            }

            return true;
        };

        return PersistableCompositionPolicy;
    }
);
