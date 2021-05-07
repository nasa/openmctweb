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
export default class MoveAction {
    constructor(openmct) {
        this.name = 'Move';
        this.key = 'move';
        this.description = 'Move this object from its containing object to another object.';
        this.cssClass = "icon-move";
        this.group = "action";
        this.priority = 7;

        this.openmct = openmct;
    }

    async invoke(objectPath) {
        let object = objectPath[0];
        let inNavigationPath = this.inNavigationPath(object);
        let oldParent = objectPath[1];
        let dialogService = this.openmct.$injector.get('dialogService');
        let dialogForm = this.getDialogForm(object, oldParent);
        let userInput = await dialogService.getUserInput(dialogForm, { name: object.name });

        // if we need to update name
        if (object.name !== userInput.name) {
            this.openmct.objects.mutate(object, 'name', userInput.name);
        }

        let parentContext = userInput.location.getCapability('context');
        let newParent = await this.openmct.objects.get(parentContext.domainObject.id);

        if (inNavigationPath && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        this.addToNewParent(object, newParent);
        this.removeFromOldParent(oldParent, object);

        if (inNavigationPath) {
            let newObjectPath = await this.openmct.objects.getOriginalPath(object.identifier);
            let root = await this.openmct.objects.getRoot();
            let rootChildCount = root.composition.length;

            // if not multiple root children, remove root from path
            if (rootChildCount < 2) {
                newObjectPath.pop(); // remove ROOT
            }

            this.navigateTo(newObjectPath);
        }
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

    addToNewParent(child, newParent) {
        let newParentKeyString = this.openmct.objects.makeKeyString(newParent.identifier);
        let compositionCollection = this.openmct.composition.get(newParent);

        this.openmct.objects.mutate(child, 'location', newParentKeyString);
        compositionCollection.add(child);
    }

    removeFromOldParent(parent, child) {
        let compositionCollection = this.openmct.composition.get(parent);

        compositionCollection.remove(child);
    }

    getDialogForm(object, parent) {
        return {
            name: "Move Item",
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
                        },
                        {
                            name: "location",
                            control: "locator",
                            validate: this.validate(object, parent),
                            key: 'location'
                        }
                    ]
                }
            ]
        };
    }

    validate(object, currentParent) {
        return (parentCandidate) => {
            let currentParentKeystring = this.openmct.objects.makeKeyString(currentParent.identifier);
            let parentCandidateKeystring = this.openmct.objects.makeKeyString(parentCandidate.getId());
            let objectKeystring = this.openmct.objects.makeKeyString(object.identifier);

            if (!parentCandidateKeystring || !currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === objectKeystring) {
                return false;
            }

            if (parentCandidate.getModel().composition.indexOf(objectKeystring) !== -1) {
                return false;
            }

            return this.openmct.composition.checkPolicy(
                parentCandidate.useCapability('adapter'),
                object
            );
        };
    }

    appliesTo(objectPath) {
        let parent = objectPath[1];
        let parentType = parent && this.openmct.types.get(parent.type);
        let child = objectPath[0];
        let childType = child && this.openmct.types.get(child.type);

        if (child.locked || (parent && parent.locked)) {
            return false;
        }

        return parentType
            && parentType.definition.creatable
            && childType
            && childType.definition.creatable
            && Array.isArray(parent.composition);
    }
}
