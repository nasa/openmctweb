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
    ["./CopyTask"],
    function (CopyTask) {

        /**
         * CopyService provides an interface for deep copying objects from one
         * location to another.  It also provides a method for determining if
         * an object can be copied to a specific location.
         * @constructor
         * @memberof platform/entanglement
         * @implements {platform/entanglement.AbstractComposeService}
         */
        function CopyService($q, policyService, openmct) {
            this.$q = $q;
            this.policyService = policyService;
            this.openmct = openmct;
        }

        CopyService.prototype.validate = function (object, parentCandidate) {
            if (!parentCandidate || !parentCandidate.getId) {
                return false;
            }

            if (parentCandidate.getId() === object.getId()) {
                return false;
            }

            return this.openmct.composition.checkPolicy(parentCandidate.useCapability('adapter'), object.useCapability('adapter'));
        };

        /**
         * A function used to check if a domain object should be cloned
         * or not.
         * @callback platform/entanglement.CopyService~filter
         * @param {DomainObject} domainObject the object to be cloned
         * @returns {boolean} true if the object should be cloned; false
         *          if it should be linked
         */

        /**
         * Creates a duplicate of the object tree starting at domainObject to
         * the new parent specified.
         *
         * Any domain objects which cannot be created will not be cloned;
         * instead, these will appear as links. If a filtering function
         * is provided, any objects which fail that check will also be
         * linked instead of cloned
         *
         * @param {DomainObject} domainObject the object to duplicate
         * @param {DomainObject} parent the destination for the clone
         * @param {platform/entanglement.CopyService~filter} [filter]
         *        an optional function used to filter out objects from
         *        the cloning process
         * @returns a promise that will be completed with the clone of
         * domainObject when the duplication is successful.
         */
        CopyService.prototype.perform = function (domainObject, parent, filter) {
            var policyService = this.policyService;

            // Combines caller-provided filter (if any) with the
            // baseline behavior of respecting creation policy.
            function filterWithPolicy(domainObj) {
                return (!filter || filter(domainObj))
                    && policyService.allow(
                        "creation",
                        domainObj.getCapability("type")
                    );
            }

            if (this.validate(domainObject, parent)) {
                return new CopyTask(
                    domainObject,
                    parent,
                    filterWithPolicy,
                    this.$q
                ).perform();
            } else {
                throw new Error(
                    "Tried to copy objects without validating first."
                );
            }
        };

        return CopyService;
    }
);

