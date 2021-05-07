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
export default class RemoveAction {
    constructor(openmct) {
        this.name = 'Remove';
        this.key = 'remove';
        this.description = 'Remove this object from its containing object.';
        this.cssClass = "icon-trash";
        this.group = "action";
        this.priority = 1;

        this.openmct = openmct;
    }

    invoke(objectPath) {
        let object = objectPath[0];
        let parent = objectPath[1];
        this.showConfirmDialog(object).then(() => {
            this.removeFromComposition(parent, object);
            if (this.inNavigationPath(object)) {
                this.navigateTo(objectPath.slice(1));
            }
        }).catch(() => {});
    }

    showConfirmDialog(object) {
        return new Promise((resolve, reject) => {
            let dialog = this.openmct.overlays.dialog({
                title: `Remove ${object.name}`,
                iconClass: 'alert',
                message: 'Warning! This action will remove this object. Are you sure you want to continue?',
                buttons: [
                    {
                        label: 'OK',
                        callback: () => {
                            dialog.dismiss();
                            resolve();
                        }
                    },
                    {
                        label: 'Cancel',
                        callback: () => {
                            dialog.dismiss();
                            reject();
                        }
                    }
                ]
            });
        });
    }

    inNavigationPath(object) {
        return this.openmct.router.path
            .some(objectInPath => this.openmct.objects.areIdsEqual(objectInPath.identifier, object.identifier));
    }

    navigateTo(objectPath) {
        let urlPath = objectPath.reverse()
            .map(object => this.openmct.objects.makeKeyString(object.identifier))
            .join("/");

        window.location.href = '#/browse/' + urlPath;
    }

    removeFromComposition(parent, child) {
        let composition = parent.composition.filter(id =>
            !this.openmct.objects.areIdsEqual(id, child.identifier)
        );

        this.openmct.objects.mutate(parent, 'composition', composition);

        if (this.inNavigationPath(child) && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        const parentKeyString = this.openmct.objects.makeKeyString(parent.identifier);
        const isAlias = parentKeyString !== child.location;

        if (!isAlias) {
            this.openmct.objects.mutate(child, 'location', null);
        }
    }

    appliesTo(objectPath) {
        let parent = objectPath[1];
        let parentType = parent && this.openmct.types.get(parent.type);
        let child = objectPath[0];
        let locked = child.locked ? child.locked : parent && parent.locked;
        let isEditing = this.openmct.editor.isEditing();

        if (isEditing) {
            let currentItemInView = this.openmct.router.path[0];
            let domainObject = objectPath[0];

            if (this.openmct.objects.areIdsEqual(currentItemInView.identifier, domainObject.identifier)) {
                return false;
            }
        }

        if (locked) {
            return false;
        }

        return parentType
            && parentType.definition.creatable
            && Array.isArray(parent.composition);
    }
}
