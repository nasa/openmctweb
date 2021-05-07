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
 * Module defining ContextCapability. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {

        /**
         * The `context` capability of a domain object (retrievable with
         * `domainObject.getCapability("context")`) allows an object's
         * hierarchical parents and ancestors to be retrieved (specifically,
         * those whose `composition` capability was used to access this
         * object.)
         *
         * @memberof platform/core
         * @constructor
         * @implements {Capability}
         */
        function ContextCapability(parentObject, domainObject) {
            this.parentObject = parentObject;
            this.domainObject = domainObject;
        }

        /**
         * Get the immediate parent of a domain object.
         *
         * A domain object may be contained in multiple places; its
         * parent (as exposed by this capability) is the domain
         * object from which this object was accessed, usually
         * by way of a `composition` capability.
         *
         * @returns {DomainObject} the immediate parent of this
         *          domain object.
         */
        ContextCapability.prototype.getParent = function () {
            return this.parentObject;
        };

        /**
         * Get an array containing the complete direct ancestry
         * of this domain object, including the domain object
         * itself.
         *
         * A domain object may be contained in multiple places; its
         * parent and all ancestors (as exposed by this capability)
         * serve as a record of how this specific domain object
         * instance was reached.
         *
         * The first element in the returned array is the deepest
         * ancestor; subsequent elements are progressively more
         * recent ancestors, with the domain object which exposed
         * the capability occupying the last element of the array.
         *
         * @returns {DomainObject[]} the full composition ancestry
         *          of the domain object which exposed this
         *          capability.
         */
        ContextCapability.prototype.getPath = function () {
            var parentObject = this.parentObject,
                parentContext =
                    parentObject && parentObject.getCapability('context'),
                parentPath = parentContext
                    ? parentContext.getPath() : [this.parentObject];

            return parentPath.concat([this.domainObject]);
        };

        /**
         * Get the deepest ancestor available for this domain object;
         * equivalent to `getPath()[0]`.
         *
         * See notes on `getPath()` for how ancestry is defined in
         * the context of this capability.
         *
         * @returns {DomainObject} the deepest ancestor of the domain
         *          object which exposed this capability.
         */
        ContextCapability.prototype.getRoot = function () {
            var parentContext = this.parentObject
                && this.parentObject.getCapability('context');

            return parentContext
                ? parentContext.getRoot()
                : (this.parentObject || this.domainObject);
        };

        return ContextCapability;
    }
);
