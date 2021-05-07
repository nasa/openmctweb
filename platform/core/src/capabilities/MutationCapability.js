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
 * Module defining MutationCapability. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {

        var GENERAL_TOPIC = "mutation",
            TOPIC_PREFIX = "mutation:";

        // Utility function to overwrite a destination object
        // with the contents of a source object.
        function copyValues(destination, source) {
            // First, remove all previously-existing keys
            Object.keys(destination).forEach(function (k) {
                delete destination[k];
            });
            // Second, write all new keys
            Object.keys(source).forEach(function (k) {
                destination[k] = source[k];
            });
        }

        // Utility function to cast to a promise, without waiting
        // for nextTick if a value is non-promise-like.
        function fastPromise(value) {
            return (value || {}).then ? value : {
                then: function (callback) {
                    return fastPromise(callback(value));
                }
            };
        }

        /**
         * The `mutation` capability allows a domain object's model to be
         * modified. Wrapping such modifications in calls made through
         * this capability allows these changes to be tracked (e.g. to
         * ensure that a domain object's `modified` timestamp is kept
         * up-to-date.)
         *
         * Usage:
         *
         * ```
         * domainObject.useCapability("mutation", function (model) {
         *     // make changes to model here...
         * });
         * ```
         *
         * @param {Function} topic a service for creating listeners
         * @param {Function} now a service to get the current time
         * @param {DomainObject} domainObject the domain object
         *        which will expose this capability
         * @memberof platform/core
         * @constructor
         * @implements {Capability}
         */
        function MutationCapability(topic, now, domainObject) {
            this.generalMutationTopic =
                topic(GENERAL_TOPIC);
            this.specificMutationTopic =
                topic(TOPIC_PREFIX + domainObject.getId());

            this.now = now;
            this.domainObject = domainObject;
        }

        /**
         * Modify the domain object's model, using a provided
         * function. This function will receive a copy of the
         * domain object's model as an argument; behavior
         * varies depending on that function's return value:
         *
         * * If no value (or undefined) is returned by the mutator,
         *   the state of the model object delivered as the mutator's
         *   argument will become the domain object's new model.
         *   This is useful for writing code that modifies the model
         *   directly.
         * * If a plain object is returned, that object will be used
         *   as the domain object's new model.
         * * If boolean `false` is returned, the mutation will be
         *   cancelled.
         * * If a promise is returned, its resolved value will be
         *   handled as one of the above.
         *
         *
         * @param  {Function} mutator the function which will make
         *         changes to the domain object's model.
         * @param  {number} [timestamp] timestamp to record for
         *         this mutation (otherwise, system time will be
         *         used)
         * @returns {Promise.<boolean>} a promise for the result
         *         of the mutation; true if changes were made.
         */
        MutationCapability.prototype.mutate = function (mutator, timestamp) {
            // Get the object's model and clone it, so the
            // mutator function has a temporary copy to work with.
            var domainObject = this.domainObject,
                now = this.now,
                generalTopic = this.generalMutationTopic,
                specificTopic = this.specificMutationTopic,
                model = domainObject.getModel(),
                clone = JSON.parse(JSON.stringify(model)),
                useTimestamp = arguments.length > 1;

            function notifyListeners(newModel) {
                generalTopic.notify(domainObject);
                specificTopic.notify(newModel);
            }

            // Function to handle copying values to the actual
            function handleMutation(mutationResult) {
                // If mutation result was undefined, just use
                // the clone; this allows the mutator to omit return
                // values and just change the model directly.
                var result = mutationResult || clone;

                // Allow mutators to change their mind by
                // returning false.
                if (mutationResult !== false) {
                    // Copy values if result was a different object
                    // (either our clone or some other new thing)
                    if (model !== result) {
                        copyValues(model, result);
                    }

                    model.modified = useTimestamp ? timestamp : now();
                    notifyListeners(model);
                }

                // Report the result of the mutation
                return mutationResult !== false;
            }

            // Invoke the provided mutator, then make changes to
            // the underlying model (if applicable.)
            return fastPromise(mutator(clone)).then(handleMutation);
        };

        /**
         * Listen for mutations of this domain object's model.
         * The provided listener will be invoked with the domain
         * object's new model after any changes. To stop listening,
         * invoke the function returned by this method.
         * @param {Function} listener function to call on mutation
         * @returns {Function} a function to stop listening
         * @memberof platform/core.MutationCapability#
         */
        MutationCapability.prototype.listen = function (listener) {
            return this.specificMutationTopic.listen(listener);
        };

        /**
         * Alias of `mutate`, used to support useCapability.
         */
        MutationCapability.prototype.invoke =
            MutationCapability.prototype.mutate;

        return MutationCapability;
    }
);

