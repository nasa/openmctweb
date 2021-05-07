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

define(
    ['objectUtils'],
    function (objectUtils) {

        /**
         * Policy that prevents editing of any object from a provider that does not
         * support persistence (ie. the 'save' operation). Editing is prevented
         * as a subsequent save would fail, causing the loss of a user's changes.
         * @param openmct
         * @constructor
         */
        function EditPersistableObjectsPolicy(openmct) {
            this.openmct = openmct;
        }

        EditPersistableObjectsPolicy.prototype.allow = function (action, context) {
            var domainObject = context.domainObject;
            var key = action.getMetadata().key;
            var category = (context || {}).category;

            // Use category to selectively block edit from the view. Edit action
            // is also invoked during the create process which should be allowed,
            // because it may be saved elsewhere
            if ((key === 'edit' && category === 'view-control') || key === 'properties') {
                let identifier = this.openmct.objects.parseKeyString(domainObject.getId());

                return this.openmct.objects.isPersistable(identifier);
            }

            return true;
        };

        return EditPersistableObjectsPolicy;
    }
);
