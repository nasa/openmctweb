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

define([
    'objectUtils'
], function (objectUtils) {
    function ActionDialogDecorator(mct, actionService) {
        this.mct = mct;
        this.actionService = actionService;
    }

    ActionDialogDecorator.prototype.getActions = function (context) {
        const mct = this.mct;

        return this.actionService.getActions(context).map(function (action) {
            if (action.dialogService) {
                const domainObject = objectUtils.toNewFormat(
                    context.domainObject.getModel(),
                    objectUtils.parseKeyString(context.domainObject.getId())
                );
                const providers = mct.propertyEditors.get(domainObject, mct.router.path);

                if (providers.length > 0) {
                    action.dialogService = Object.create(action.dialogService);
                    action.dialogService.getUserInput = function (form) {
                        return new mct.Dialog(
                            providers[0].view(context.domainObject),
                            form.title
                        ).show();
                    };
                }
            }

            return action;
        });
    };

    return ActionDialogDecorator;
});
