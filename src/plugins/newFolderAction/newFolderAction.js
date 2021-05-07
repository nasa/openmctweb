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

import uuid from 'uuid';

export default class NewFolderAction {
    constructor(openmct) {
        this.name = 'Add New Folder';
        this.key = 'newFolder';
        this.description = 'Create a new folder';
        this.cssClass = 'icon-folder-new';
        this.group = "action";
        this.priority = 9;

        this._openmct = openmct;
        this._dialogForm = {
            name: "Add New Folder",
            sections: [
                {
                    rows: [
                        {
                            key: "name",
                            control: "textfield",
                            name: "Folder Name",
                            pattern: "\\S+",
                            required: true,
                            cssClass: "l-input-lg"
                        }
                    ]
                }
            ]
        };
    }
    invoke(objectPath) {
        let domainObject = objectPath[0];
        let parentKeystring = this._openmct.objects.makeKeyString(domainObject.identifier);
        let composition = this._openmct.composition.get(domainObject);
        let dialogService = this._openmct.$injector.get('dialogService');
        let folderType = this._openmct.types.get('folder');

        dialogService.getUserInput(this._dialogForm, {name: 'Unnamed Folder'}).then((userInput) => {
            let name = userInput.name;

            let identifier = {
                key: uuid(),
                namespace: domainObject.identifier.namespace
            };

            let objectModel = {
                identifier,
                type: 'folder',
                location: parentKeystring
            };

            folderType.definition.initialize(objectModel);
            objectModel.name = name || 'New Folder';
            objectModel.modified = Date.now();

            this._openmct.objects.save(objectModel).then(() => {
                composition.add(objectModel);
            });

        });
    }
    appliesTo(objectPath) {
        let domainObject = objectPath[0];

        return domainObject.type === 'folder';
    }
}
