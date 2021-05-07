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
 * Module defining CreateAction. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {

        /**
         * The Create Action is performed to create new instances of
         * domain objects of a specific type. This is the action that
         * is performed when a user uses the Create menu.
         *
         * @memberof platform/commonUI/browse
         * @implements {Action}
         * @constructor
         *
         * @param {Type} type the type of domain object to create
         * @param {DomainObject} parent the domain object that should
         *        act as a container for the newly-created object
         *        (note that the user will have an opportunity to
         *        override this)
         * @param {ActionContext} context the context in which the
         *        action is being performed
         */
        function CreateAction(type, parent, context, openmct) {
            this.metadata = {
                key: 'create',
                cssClass: type.getCssClass(),
                name: type.getName(),
                type: type.getKey(),
                description: type.getDescription(),
                context: context
            };
            this.type = type;
            this.parent = parent;
            this.openmct = openmct;
        }

        /**
         * Create a new object of the given type.
         * This will prompt for user input first.
         */
        CreateAction.prototype.perform = function () {
            var newModel = this.type.getInitialModel(),
                openmct = this.openmct,
                newObject;

            function onCancel() {
                openmct.editor.cancel();
            }

            function isFirstViewEditable(domainObject, objectPath) {
                let firstView = openmct.objectViews.get(domainObject, objectPath)[0];

                return firstView && firstView.canEdit && firstView.canEdit(domainObject, objectPath);
            }

            function navigateAndEdit(object) {
                let objectPath = object.getCapability('context').getPath(),
                    url = '#/browse/' + objectPath
                        .slice(1)
                        .map(function (o) {
                            return o && openmct.objects.makeKeyString(o.getId());
                        })
                        .join('/');

                window.location.href = url;

                if (isFirstViewEditable(object.useCapability('adapter'), objectPath)) {
                    openmct.editor.edit();
                }
            }

            newModel.type = this.type.getKey();
            newModel.location = this.parent.getId();
            newObject = this.parent.useCapability('instantiation', newModel);

            openmct.editor.edit();
            newObject.getCapability("action").perform("save-as").then(navigateAndEdit, onCancel);
            // TODO: support editing object without saving object first.
            // Which means we have to toggle createwizard afterwards.  For now,
            // We will disable this.
        };

        /**
         * Metadata associated with a Create action.
         * @typedef {ActionMetadata} CreateActionMetadata
         * @property {string} type the key for the type of domain object
         *           to be created
         */

        /**
         * Get metadata about this action.
         * @returns {CreateActionMetadata} metadata about this action
         */
        CreateAction.prototype.getMetadata = function () {
            return this.metadata;
        };

        return CreateAction;
    }
);
