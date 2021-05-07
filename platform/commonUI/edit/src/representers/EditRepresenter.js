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
         * The EditRepresenter is responsible for implementing
         * representation-level behavior relevant to Edit mode.
         * Specifically, this listens for changes to view configuration
         * or to domain object models, and triggers persistence when
         * these are detected.
         *
         * This is exposed as an extension of category `representers`,
         * which mct-representation will utilize to add additional
         * behavior to each representation.
         *
         * This will be called once per mct-representation directive,
         * and may be reused for different domain objects and/or
         * representations resulting from changes there.
         *
         * @memberof platform/commonUI/edit
         * @implements {Representer}
         * @constructor
         */
        function EditRepresenter($log, $scope) {
            this.$log = $log;
            this.$scope = $scope;

            this.$scope.commit = this.commit.bind(this);
        }

        /**
         * Commit any changes made to the in-scope model to the domain object.
         * Also commits any changes made to $scope.configuration to the proper
         * configuration value for the current representation.
         *
         * @param {String} message a message to log with the commit message.
         */
        EditRepresenter.prototype.commit = function (message) {
            var model = this.$scope.model,
                configuration = this.$scope.configuration,
                domainObject = this.domainObject;

            this.$log.debug([
                "Committing ",
                domainObject && domainObject.getModel().name,
                "(" + (domainObject && domainObject.getId()) + "):",
                message
            ].join(" "));

            if (this.domainObject) {
                if (this.key && configuration) {
                    model.configuration = model.configuration || {};
                    model.configuration[this.key] = configuration;
                }

                domainObject.useCapability('mutation', function () {
                    return model;
                });
            }
        };

        // Handle a specific representation of a specific domain object
        EditRepresenter.prototype.represent = function (representation, representedObject) {
            this.domainObject = representedObject;
            if (representation) {
                this.key = representation.key;
            } else {
                delete this.key;
            }
        };

        // Respond to the destruction of the current representation.
        EditRepresenter.prototype.destroy = function () {};

        return EditRepresenter;
    }
);
